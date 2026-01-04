import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Link as LinkIcon, Upload, Trash2, Eye, Edit3, ArrowDownToLine } from 'lucide-react';
import FileViewer from '../components/FileViewer';
import { noteAPI } from '../services/api';
import './NotebookPage.css';
import '../styles/cursor.css';

// Debounce utility - uses ref to always call latest callback
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return stable debounced function
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

// Resizable Image Component - Memoized to prevent unnecessary re-renders
const ResizableImage = memo(function ResizableImage({ src, alt, caption, initialWidth, onResize, imageMarkdown, onMove }) {
  const [width, setWidth] = useState(initialWidth || null);
  const [isResizing, setIsResizing] = useState(false);
  const [showHandles, setShowHandles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    // Set initial width from actual image if not specified
    if (!width && imageRef.current) {
      const img = imageRef.current;
      if (img.complete) {
        setWidth(Math.min(img.naturalWidth, 600)); // Max 600px by default
      } else {
        img.onload = () => {
          setWidth(Math.min(img.naturalWidth, 600));
        };
      }
    }
  }, [width]);

  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width || imageRef.current?.offsetWidth || 0;

    const handleMouseMove = (moveEvent) => {
      const deltaX = direction === 'right' 
        ? moveEvent.clientX - startXRef.current 
        : startXRef.current - moveEvent.clientX;
      
      const newWidth = Math.max(100, Math.min(1200, startWidthRef.current + deltaX * 2));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Trigger resize callback with final width
      if (onResize && width) {
        onResize(Math.round(width));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', imageMarkdown);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`embedded-image ${isResizing ? 'resizing' : ''} ${isDragging ? 'dragging' : ''}`}
      onMouseEnter={() => setShowHandles(true)}
      onMouseLeave={() => !isResizing && setShowHandles(false)}
      style={{ width: width ? `${width}px` : 'auto' }}
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="resizable-image-container">
        <div className="drag-handle" title="Drag to move image">⋮⋮</div>
        <img 
          ref={imageRef}
          src={src} 
          alt={alt} 
          className="embedded-image-content"
          draggable={false}
          loading="lazy"
        />
        
        {showHandles && (
          <>
            <div 
              className="resize-handle resize-handle-left"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <div 
              className="resize-handle resize-handle-right"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
            <div 
              className="resize-handle resize-handle-bottom-left"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <div 
              className="resize-handle resize-handle-bottom-right"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
          </>
        )}
      </div>
      {caption && <p className="embed-caption">{caption}</p>}
    </div>
  );
});

function NotebookPage() {
  const { notebookId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const [notebook, setNotebook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFiles, setNoteFiles] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerPage, setViewerPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('notka-theme');
    return saved === 'dark';
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    loadNotebook();
    loadNotes();
  }, [notebookId]);

  useEffect(() => {
    localStorage.setItem('notka-theme', darkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
    // Keep editor focused in both modes so cursor stays visible
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  const loadNotebook = () => {
    const notebooks = JSON.parse(localStorage.getItem('notebooks') || '[]');
    const nb = notebooks.find((n) => n.id === notebookId);
    if (nb) {
      setNotebook(nb);
    } else {
      navigate('/');
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await noteAPI.getAllNotes();
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewNote = async () => {
    try {
      const newNote = await noteAPI.createNote({
        title: 'Untitled Note',
        content: '',
      });
      setNotes([newNote, ...notes]);
      setCurrentNote(newNote);
      setNoteTitle(newNote.title);
      setNoteContent(newNote.content);
      setNoteFiles([]);
      // Auto-focus the editor
      setTimeout(() => {
        editorRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note');
    }
  };

  const handleSelectNote = useCallback((note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    // Load files associated with this note (use files array if available, fallback to file_path)
    const filesArray = note.files && note.files.length > 0 
      ? note.files 
      : (note.file_path ? [note.file_path] : []);
    const files = filesArray.map(path => ({ path, name: extractFileName(path) }));
    setNoteFiles(files);
    console.log('Loaded note with files:', files);
    // Focus immediately - no setTimeout needed
    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  }, []);

  const extractFileName = (path) => {
    if (!path) return '';
    return path.split('/').pop();
  };

  // Debounced auto-save (1 second delay)
  // Note: handleSaveNote is NOT wrapped in useCallback to avoid stale closure issues
  // This ensures the debounced function always uses the latest state values
  const debouncedSave = useDebounce(async () => {
    if (!currentNote) {
      console.log('[DEBUG] debouncedSave: No current note, skipping save');
      return;
    }

    console.log('[DEBUG] debouncedSave triggered for note:', currentNote._id);
    console.log('[DEBUG] Content being saved:', noteContent.substring(0, 200) + '...');

    try {
      setIsSaving(true);
      const response = await noteAPI.updateNote(currentNote._id, {
        title: noteTitle,
        content: noteContent,
      });
      console.log('[DEBUG] Save successful, response:', response);
      // Update notes list
      setNotes(notes.map(n => n._id === currentNote._id ? { ...n, title: noteTitle, content: noteContent } : n));
    } catch (error) {
      console.error('[DEBUG] Failed to save note:', error);
      alert('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleFileUpload = async (e) => {
    if (!currentNote) {
      alert('Please select or create a note first');
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    try {
      // Add file to the existing note (appends to files array)
      const updatedNote = await noteAPI.addFileToNote(currentNote._id, file);
      
      console.log('File uploaded, updated note:', updatedNote);
      
      // Update current note with all files
      setCurrentNote(updatedNote);
      
      // Build files array from the updated note
      const filesArray = updatedNote.files && updatedNote.files.length > 0 
        ? updatedNote.files 
        : (updatedNote.file_path ? [updatedNote.file_path] : []);
      const files = filesArray.map(path => ({ path, name: extractFileName(path) }));
      setNoteFiles(files);  // Update with ALL files (not just the new one)
      
      // Update the note in the notes list
      setNotes(notes.map(n => n._id === updatedNote._id ? updatedNote : n));
      
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert(`Failed to upload file: ${error.response?.data?.detail || error.message}`);
    }
    
    // Clear the file input
    e.target.value = null;
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    setSelectedText(text);
  }, []);

  // Debounced text selection (300ms delay)
  const debouncedTextSelection = useDebounce(handleTextSelection, 300);

  const handleCreateLink = () => {
    if (!selectedText) {
      alert('Please select some text first');
      return;
    }

    if (noteFiles.length === 0) {
      alert('Please upload a file first before creating links');
      return;
    }

    // Show file selection modal
    setShowFileSelector(true);
  };

  const handleFileSelection = (fileIndex, pageNumber) => {
    const selectedFile = noteFiles[fileIndex];
    
    // Close file selector and open FileViewer for navigation
    setShowFileSelector(false);
    
    // Open FileViewer with the selected file
    setViewerFile({
      ...currentNote,
      file_path: selectedFile.path,
      page_number: pageNumber || 1,
      timestamp: null
    });
    setShowFileViewer(true);
    
    // User will navigate in FileViewer and create link from there
  };

  const handleLinkClick = useCallback((filePath, page, timestamp, anchorText = null) => {
    // Normalize both the clicked path and stored paths for comparison
    const normalizePath = (path) => {
      if (!path) return path;
      return path.startsWith('../') ? path.substring(3) : path;
    };

    const normalizedFilePath = normalizePath(filePath);
    const file = noteFiles.find(f => normalizePath(f.path) === normalizedFilePath);

    if (file) {
      // Create a proper file viewer object with the file's data
      setViewerFile({
        title: file.name || extractFileName(file.path),
        file_path: file.path,  // Use the original path from noteFiles
        page_number: page || 1,
        timestamp: timestamp || null,
        anchor_text: anchorText || null  // Include text anchor for paragraph-level linking
      });
      setViewerPage(page || 1);
      setShowFileViewer(true);
    } else {
      console.warn('File not found in noteFiles:', filePath, 'Available files:', noteFiles);
      // Fallback: try to open the file anyway using the normalized path
      setViewerFile({
        title: extractFileName(normalizedFilePath),
        file_path: normalizedFilePath,
        page_number: page || 1,
        timestamp: timestamp || null
      });
      setViewerPage(page || 1);
      setShowFileViewer(true);
    }
  }, [noteFiles]);

  const handleImageResize = useCallback((fullMatch, newWidth) => {
    // Update the image markdown with new width
    const widthRegex = /\?width=\d+/;
    let updatedMatch;
    
    if (widthRegex.test(fullMatch)) {
      // Replace existing width
      updatedMatch = fullMatch.replace(widthRegex, `?width=${newWidth}`);
    } else {
      // Add width parameter
      updatedMatch = fullMatch.replace(/\)$/, `?width=${newWidth})`);
    }
    
    // Update note content
    const newContent = noteContent.replace(fullMatch, updatedMatch);
    setNoteContent(newContent);
    
    // Use debounced save
    debouncedSave();
  }, [noteContent, debouncedSave]);

  // Memoize the expensive renderContentWithLinks function
  const renderedContent = useMemo(() => {
    if (!noteContent) return [];

    const parts = [];
    let lastIndex = 0;
    let key = 0;

    // Combined regex for both embedded media (![...]) and links ([...])
    // Supports both regular URLs and angle-bracket enclosed URLs
    // Pattern: ![text](file://path) OR ![text](<file://path>)
    // Updated to handle parentheses in filenames by using angle brackets
    const combinedRegex = /(!?\[([^\]]*)\]\(<file:\/\/([^>]+)>\)|!?\[([^\]]*)\]\(file:\/\/([^)\s]+)\))/g;
    let match;

    while ((match = combinedRegex.exec(noteContent)) !== null) {
      const [fullMatch, , angleBracketText, angleBracketPath, noAngleBracketText, noAngleBracketPath] = match;
      // Handle both angle bracket and non-angle bracket formats
      const text = angleBracketText || noAngleBracketText;
      const filePathWithParams = angleBracketPath || noAngleBracketPath;
      const isEmbedded = fullMatch.startsWith('!');

      // Add text before this element
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {noteContent.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Extract file path, page number, timestamp, anchor, and width if present
      // Supports: #page=5, #page=5&anchor=text, #t=90, ?width=600
      const paramsMatch = filePathWithParams.match(/^([^#?]+)(?:#(?:page=(\d+)(?:&anchor=([^&?]+))?|t=(\d+)))?(?:\?width=(\d+))?$/);
      if (paramsMatch) {
        const [, filePath, page, encodedAnchor, timestamp, width] = paramsMatch;
        const anchorText = encodedAnchor ? decodeURIComponent(encodedAnchor) : null;
        const fileExt = filePath.split('.').pop().toLowerCase();
        const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
        const isVideo = videoExts.includes(fileExt);
        const isImage = imageExts.includes(fileExt);

        if (isEmbedded && (isVideo || isImage)) {
          // Render embedded media (video or image)
          const fileUrl = noteAPI.getFileUrl(filePath);

          if (isVideo) {
            const videoTimestamp = timestamp ? parseInt(timestamp) : null;
            parts.push(
              <div key={`embed-${key++}`} className="embedded-video">
                <video
                  controls
                  className="embedded-video-player"
                  onLoadedMetadata={(e) => {
                    if (videoTimestamp) {
                      e.target.currentTime = videoTimestamp;
                    }
                  }}
                >
                  <source src={fileUrl} type={`video/${fileExt === 'm4v' ? 'mp4' : fileExt}`} />
                  Your browser does not support the video tag.
                </video>
                {text && <p className="embed-caption">{text}</p>}
              </div>
            );
          } else if (isImage) {
            parts.push(
              <ResizableImage
                key={`embed-${key++}`}
                src={fileUrl}
                alt={text || 'Image'}
                caption={text || null}
                initialWidth={width ? parseInt(width) : null}
                imageMarkdown={fullMatch}
                onResize={(newWidth) => handleImageResize(fullMatch, newWidth)}
              />
            );
          }
        } else {
          // Render as clickable link
          console.log('Rendering link:', { text, filePath, page, timestamp, anchorText });
          parts.push(
            <span
              key={`link-${key++}`}
              className="file-link"
              onClick={() => {
                console.log('Link clicked:', { filePath, page, timestamp, anchorText });
                handleLinkClick(
                  filePath,
                  page ? parseInt(page) : null,
                  timestamp ? parseInt(timestamp) : null,
                  anchorText
                );
              }}
            >
              {text}
            </span>
          );
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < noteContent.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {noteContent.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [noteContent, noteFiles, handleImageResize, handleLinkClick]);

  const handleDeleteNote = (note) => {
    // Show custom confirmation modal instead of browser confirm
    setNoteToDelete(note);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      await noteAPI.deleteNote(noteToDelete._id);
      setNotes(notes.filter(n => n._id !== noteToDelete._id));
      if (currentNote && currentNote._id === noteToDelete._id) {
        setCurrentNote(null);
        setNoteTitle('');
        setNoteContent('');
        setNoteFiles([]);
      }
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
    }
  };

  const cancelDeleteNote = () => {
    setShowDeleteConfirm(false);
    setNoteToDelete(null);
  };

  const handleFileClick = (file) => {
    // Open file in viewer
    const fileExt = file.path.split('.').pop().toLowerCase();
    const pdfExts = ['pdf'];
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
    
    let page = 1;
    if (!imageExts.includes(fileExt) && !videoExts.includes(fileExt)) {
      page = 1; // Default to page 1 for PDFs/docs
    }
    
    handleLinkClick(file.path, page);
  };

  const handleDeleteFile = (file, e) => {
    e.stopPropagation(); // Prevent opening file when clicking delete
    setFileToDelete(file);
    setShowDeleteFileConfirm(true);
  };

  const confirmDeleteFile = async () => {
    if (!currentNote || !fileToDelete) return;
    
    try {
      const updatedNote = await noteAPI.deleteFileFromNote(currentNote._id, fileToDelete.path);
      
      // Update local state
      setCurrentNote(updatedNote);
      const filesArray = updatedNote.files && updatedNote.files.length > 0 
        ? updatedNote.files 
        : (updatedNote.file_path ? [updatedNote.file_path] : []);
      const files = filesArray.map(path => ({ path, name: extractFileName(path) }));
      setNoteFiles(files);
      setNotes(notes.map(n => n._id === updatedNote._id ? updatedNote : n));
      
      setShowDeleteFileConfirm(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const cancelDeleteFile = () => {
    setShowDeleteFileConfirm(false);
    setFileToDelete(null);
  };

  const handleInsertLink = (markdownLink) => {
    if (!currentNote) return;

    // Get cursor position in textarea
    const textarea = editorRef.current;
    if (!textarea) {
      // Fallback to appending at the end
      const newContent = noteContent + '\n\n' + markdownLink + '\n\n';
      setNoteContent(newContent);
      debouncedSave();
      return;
    }

    const position = cursorPosition || textarea.selectionStart;

    // Insert the markdown link at cursor position
    const newContent =
      noteContent.substring(0, position) +
      '\n\n' + markdownLink + '\n\n' +
      noteContent.substring(position);

    setNoteContent(newContent);
    console.log('[DEBUG] Inserted backward link:', markdownLink);
    debouncedSave();

    // Focus back to textarea and position cursor after the inserted link
    setTimeout(() => {
      const newCursorPosition = position + markdownLink.length + 4; // +4 for the newlines
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      setCursorPosition(newCursorPosition);
    }, 0);
  };

  const handleInsertMedia = (file) => {
    if (!currentNote) return;

    // Get cursor position in textarea
    const textarea = editorRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const fileExt = file.path.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
    const isVideo = videoExts.includes(fileExt);
    
    // Create embed code with empty caption (user can add their own text)
    // Use angle brackets to handle special characters in filenames (e.g., parentheses)
    const embedCode = `\n\n![](<file://${file.path}>)\n\n`;

    console.log('[DEBUG] handleInsertMedia - Inserting embed code:', embedCode);
    console.log('[DEBUG] Current content length:', noteContent.length);

    // Insert at cursor position
    const newContent =
      noteContent.substring(0, cursorPosition) +
      embedCode +
      noteContent.substring(cursorPosition);

    console.log('[DEBUG] New content length:', newContent.length);
    console.log('[DEBUG] New content preview:', newContent.substring(0, 300));

    setNoteContent(newContent);

    // Focus back on editor and set cursor after inserted content
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = cursorPosition + embedCode.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    console.log('[DEBUG] Calling debouncedSave...');
    // Auto-save with debounce
    debouncedSave();
  };

  if (!notebook) return null;

  return (
    <div className={`notebook-page ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="notebook-header" style={{ borderBottomColor: notebook.color }}>
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="notebook-info">
          <h1 style={{ color: notebook.color }}>{notebook.name}</h1>
        </div>
        <button className="btn-theme-toggle" onClick={toggleTheme} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="notebook-workspace">
        {/* Left Sidebar - Notes List */}
        <aside className="notes-sidebar">
          <div className="sidebar-header">
            <h3>Notes</h3>
            <button className="btn-new-note" onClick={handleCreateNewNote} title="New Note">
              <Plus size={18} />
            </button>
          </div>
          <div className="notes-list">
            {loading ? (
              <p className="sidebar-empty">Loading...</p>
            ) : notes.length === 0 ? (
              <p className="sidebar-empty">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note._id}
                  className={`note-item ${currentNote?._id === note._id ? 'active' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="note-item-header">
                    <FileText size={16} />
                    <span>{note.title}</span>
                  </div>
                  <button
                    className="btn-delete-note-sidebar"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center - Note Editor */}
        <main className="note-editor">
          {currentNote ? (
            <>
              <div className="note-header-bar">
                <input
                  type="text"
                  className="note-title-input"
                  value={noteTitle}
                  onChange={(e) => {
                    setNoteTitle(e.target.value);
                    debouncedSave();
                  }}
                  style={{ caretColor: darkMode ? '#fff' : '#000' }}
                  placeholder="Note title..."
                />
                <button
                  className={`btn-toggle-mode ${isPreviewMode ? 'preview' : 'edit'}`}
                  onClick={togglePreviewMode}
                  title={isPreviewMode ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                >
                  {isPreviewMode ? (
                    <>
                      <Edit3 size={18} />
                      <span>Edit</span>
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
              <div className={`note-content-wrapper ${isPreviewMode ? 'preview-mode' : 'edit-mode'}`}>
                <textarea
                  ref={editorRef}
                  className="note-content-editor"
                  value={noteContent}
                  onChange={(e) => {
                    setNoteContent(e.target.value);
                    setCursorPosition(e.target.selectionStart);
                    debouncedSave();
                  }}
                  onClick={(e) => setCursorPosition(e.target.selectionStart)}
                  onMouseUp={debouncedTextSelection}
                  onKeyUp={(e) => {
                    setCursorPosition(e.target.selectionStart);
                    debouncedTextSelection(e);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedText = e.dataTransfer.getData('text/plain');
                    if (droppedText && droppedText.startsWith('![')) {
                      const textarea = e.target;
                      const cursorPosition = textarea.selectionStart;
                      
                      // Remove the original image from the content (TRUE MOVE, not copy)
                      const contentWithoutOriginal = noteContent.replace(droppedText, '');
                      
                      // Calculate new cursor position after removal
                      const originalIndex = noteContent.indexOf(droppedText);
                      let adjustedCursorPosition = cursorPosition;
                      if (originalIndex < cursorPosition) {
                        adjustedCursorPosition = cursorPosition - droppedText.length;
                      }
                      
                      // Insert at new position
                      const newContent = 
                        contentWithoutOriginal.substring(0, adjustedCursorPosition) + 
                        '\n\n' + droppedText + '\n\n' +
                        contentWithoutOriginal.substring(adjustedCursorPosition);
                      
                      setNoteContent(newContent);
                      debouncedSave();
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  readOnly={isPreviewMode}
                  autoFocus
                  style={{ caretColor: darkMode ? '#fff' : '#000' }}
                  placeholder="Start typing your notes here...&#10;&#10;Select text and click 'Create Link' to link to a specific page in your uploaded files.&#10;&#10;💡 Drag images to reposition them in your note!"
                />
                <div 
                  className="note-content-preview"
                  onClick={() => editorRef.current?.focus()}
                >
                  {renderedContent}
                </div>
              </div>
              {isSaving && <div className="saving-indicator">Saving...</div>}
            </>
          ) : (
            <div className="empty-editor">
              <FileText size={80} />
              <h2>Select a note or create a new one</h2>
              <button className="btn-create-first" onClick={handleCreateNewNote}>
                <Plus size={20} />
                Create Note
              </button>
            </div>
          )}
        </main>

        {/* Right Sidebar - Files & Link Tools */}
        <aside className="files-sidebar">
          <div className="sidebar-section">
            <h3>Link Tools</h3>
            {selectedText ? (
              <div className="selected-text-preview">
                <div className="selection-icon">✓</div>
                <div className="selection-content">
                  <small>Selected Text:</small>
                  <strong>"{selectedText}"</strong>
                </div>
              </div>
            ) : (
              <div className="no-selection-hint">
                <small>💡 Click and drag to select text in your note</small>
              </div>
            )}
            <button
              className="btn-create-link"
              onClick={handleCreateLink}
              disabled={!selectedText || !currentNote}
              title={!selectedText ? "Select text first" : "Link selected text to a file page"}
            >
              <LinkIcon size={18} />
              {selectedText ? "Create Link" : "Select Text First"}
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Files</h3>
            <p className="sidebar-hint">💡 Click to preview • Hover to insert/delete</p>
            <label className="btn-upload-file">
              <Upload size={18} />
              Upload File
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.gif,.bmp,.svg,.webp,.mp4,.webm,.ogg,.mov,.avi,.mkv,.m4v"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            
            <div className="files-list">
              {noteFiles.length === 0 ? (
                <p className="sidebar-empty">No files uploaded</p>
              ) : (
                noteFiles.map((file, idx) => {
                  const fileExt = file.path.split('.').pop().toLowerCase();
                  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
                  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
                  const isVideo = videoExts.includes(fileExt);
                  const isImage = imageExts.includes(fileExt);
                  const canEmbed = isVideo || isImage;

                  return (
                    <div 
                      key={idx} 
                      className={`file-item file-item-clickable ${canEmbed ? 'file-item-embeddable' : ''}`}
                      onClick={() => handleFileClick(file)}
                      title="Click to preview"
                    >
                      <FileText size={16} />
                      <span className="file-name">{file.name}</span>
                      <div className="file-actions">
                        {isVideo && <span className="file-badge">🎬</span>}
                        {isImage && <span className="file-badge">🖼️</span>}
                        {canEmbed && (
                          <button 
                            className="btn-insert-file"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsertMedia(file);
                            }}
                            title="Insert into note"
                          >
                            <ArrowDownToLine size={14} />
                          </button>
                        )}
                        <button 
                          className="btn-delete-file"
                          onClick={(e) => handleDeleteFile(file, e)}
                          title="Delete file"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>

      {showFileViewer && viewerFile && (
        <FileViewer
          note={viewerFile}
          onClose={() => setShowFileViewer(false)}
          onInsertLink={handleInsertLink}
          selectedText={selectedText}
        />
      )}

      {showFileSelector && (
        <FileSelectorModal
          files={noteFiles}
          selectedText={selectedText}
          onSelect={handleFileSelection}
          onCancel={() => setShowFileSelector(false)}
        />
      )}

      {showDeleteConfirm && noteToDelete && (
        <DeleteConfirmationModal
          note={noteToDelete}
          onConfirm={confirmDeleteNote}
          onCancel={cancelDeleteNote}
        />
      )}

      {showDeleteFileConfirm && fileToDelete && (
        <DeleteFileModal
          file={fileToDelete}
          onConfirm={confirmDeleteFile}
          onCancel={cancelDeleteFile}
        />
      )}
    </div>
  );
}

// File Selector Modal Component
function FileSelectorModal({ files, selectedText, onSelect, onCancel }) {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Safety check
  if (!files || files.length === 0) {
    return null;
  }

  const getFileExtension = (path) => {
    if (!path) return '';
    return path.split('.').pop().toLowerCase();
  };

  const isImageFile = (path) => {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
    const ext = getFileExtension(path);
    return imageExtensions.includes(ext);
  };

  const isVideoFile = (path) => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
    const ext = getFileExtension(path);
    return videoExtensions.includes(ext);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedFile = files[selectedFileIndex];
    if (!selectedFile) return;

    // Open FileViewer for navigation - user will select page/timestamp there
    onSelect(selectedFileIndex, null);
  };

  const currentFile = files[selectedFileIndex];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📌 Create Link to File</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="selected-text-display">
            <strong>Selected Text:</strong> "{selectedText}"
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select File:</label>
              <select
                value={selectedFileIndex}
                onChange={(e) => setSelectedFileIndex(parseInt(e.target.value))}
                className="file-select"
              >
              {files.map((file, idx) => (
                <option key={idx} value={idx}>
                  {file.name} {isVideoFile(file.path) ? '🎬' : isImageFile(file.path) ? '🖼️' : '📄'}
                </option>
              ))}
              </select>
            </div>

            <div className="info-message" style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f7ff', borderLeft: '3px solid #667eea', borderRadius: '4px' }}>
              💡 <strong>Next:</strong> Preview the file and navigate to the specific page/timestamp, then create your link!
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                📂 Open & Navigate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ note, onConfirm, onCancel }) {
  const filesCount = note.files?.length || 0;
  
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete Note</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            <p className="warning-text">
              Are you sure you want to delete this note?
            </p>
          </div>

          <div className="delete-note-info">
            <strong>Note:</strong> {note.title}
            {filesCount > 0 && (
              <div className="files-warning">
                <span className="warning-badge">{filesCount} file{filesCount > 1 ? 's' : ''}</span>
                will also be permanently deleted
              </div>
            )}
          </div>

          <p className="delete-disclaimer">
            This action cannot be undone.
          </p>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-delete-confirm" onClick={onConfirm}>
              Delete Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteFileModal({ file, onConfirm, onCancel }) {
  const fileExt = file.path.split('.').pop().toLowerCase();
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
  const isVideo = videoExts.includes(fileExt);
  const isImage = imageExts.includes(fileExt);
  
  let fileIcon = '📄';
  if (isVideo) fileIcon = '🎬';
  else if (isImage) fileIcon = '🖼️';
  
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete File</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">🗑️</div>
            <p className="warning-text">
              Are you sure you want to delete this file?
            </p>
          </div>

          <div className="delete-note-info">
            <div className="file-info-display">
              <span className="file-icon">{fileIcon}</span>
              <strong>{file.name}</strong>
            </div>
          </div>

          <p className="delete-disclaimer">
            This file will be permanently deleted from the server. This action cannot be undone.
          </p>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-delete-confirm" onClick={onConfirm}>
              Delete File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotebookPage;


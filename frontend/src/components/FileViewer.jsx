import { useRef, useState } from 'react';
import { noteAPI } from '../services/api';
import LinkTextModal from './LinkTextModal';
import './FileViewer.css';

function FileViewer({ note, onClose, onInsertLink, selectedText }) {
  const videoRef = useRef(null);
  const [pdfPage, setPdfPage] = useState(note.page_number || 1);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalData, setLinkModalData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const getFileExtension = (filePath) => {
    if (!filePath) return null;
    return filePath.split('.').pop().toLowerCase();
  };

  const fileExt = getFileExtension(note.file_path);
  const fileUrl = noteAPI.getFileUrl(note.file_path);
  const pageNumber = note.page_number || 1;
  const initialTimestamp = note.timestamp || null;

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle link insertion for each media type - show modal instead of direct insert
  const handleInsertVideoLink = () => {
    if (!videoRef.current || !onInsertLink) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    const timeFormatted = formatTime(currentTime);

    setLinkModalData({
      mediaType: 'video',
      mediaInfo: {
        seconds: currentTime,
        formatted: timeFormatted
      },
      filePath: note.file_path
    });
    setShowLinkModal(true);
  };

  const handleInsertPDFLink = () => {
    if (!onInsertLink) return;

    setLinkModalData({
      mediaType: 'pdf',
      mediaInfo: {
        page: pdfPage
      },
      filePath: note.file_path
    });
    setShowLinkModal(true);
  };

  const handleInsertImageLink = () => {
    if (!onInsertLink) return;

    setLinkModalData({
      mediaType: 'image',
      mediaInfo: {},
      filePath: note.file_path
    });
    setShowLinkModal(true);
  };

  const handleLinkConfirm = (markdownLink) => {
    onInsertLink(markdownLink);
    setShowLinkModal(false);
    setLinkModalData(null);
    onClose();
  };

  const handleLinkCancel = () => {
    setShowLinkModal(false);
    setLinkModalData(null);
  };

  const renderViewer = () => {
    // Check if file path exists
    if (!note.file_path) {
      return (
        <div className="file-error">
          <h3>❌ No File Attached</h3>
          <p>This note doesn't have any file attached to it.</p>
          <button onClick={onClose} className="btn btn-primary">
            ⬅ Back to Notes
          </button>
        </div>
      );
    }

    // Check if fileUrl was generated successfully
    if (!fileUrl) {
      return (
        <div className="file-error">
          <h3>❌ Invalid File Path</h3>
          <p>Could not generate file URL from path: <code>{note.file_path}</code></p>
          <p>Please contact support or try re-uploading the file.</p>
          <button onClick={onClose} className="btn btn-primary">
            ⬅ Back to Notes
          </button>
        </div>
      );
    }

    // Check if file is on localhost (Office Online can't access localhost files)
    const isLocalhost = fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1');

    // Check if file is an image
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
    if (imageExtensions.includes(fileExt)) {
      if (imageError) {
        return (
          <div className="file-error">
            <h3>❌ Could Not Load Image</h3>
            <p>The image file could not be loaded. Possible reasons:</p>
            <ul className="error-reasons">
              <li>Backend server is not running</li>
              <li>File was deleted from server</li>
              <li>Network connection issue</li>
              <li>Invalid file path: <code>{note.file_path}</code></li>
            </ul>
            <div className="error-actions">
              <button onClick={() => setImageError(false)} className="btn btn-secondary">
                🔄 Retry
              </button>
              <a href={fileUrl} download className="btn btn-primary">
                📥 Try Download Instead
              </a>
            </div>
          </div>
        );
      }
      return (
        <div className="image-viewer">
          <img 
            src={fileUrl} 
            alt={note.title} 
            className="image-content"
            onError={() => {
              console.error('[FileViewer] Image failed to load:', fileUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('[FileViewer] Image loaded successfully:', fileUrl);
            }}
          />
          {onInsertLink && (
            <button className="btn-link-media" onClick={handleInsertImageLink} title="Insert link to this image">
              📌 Link to This Image
            </button>
          )}
        </div>
      );
    }

    // Check if file is a video
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
    if (videoExtensions.includes(fileExt)) {
      if (videoError) {
        return (
          <div className="file-error">
            <h3>❌ Could Not Load Video</h3>
            <p>The video file could not be loaded. Possible reasons:</p>
            <ul className="error-reasons">
              <li>Backend server is not running (check <code>http://localhost:8000</code>)</li>
              <li>Video file was deleted from server</li>
              <li>File format not supported by your browser</li>
              <li>Network connection issue</li>
              <li>File path: <code>{note.file_path}</code></li>
            </ul>
            <div className="error-actions">
              <button onClick={() => setVideoError(false)} className="btn btn-secondary">
                🔄 Retry
              </button>
              <a href={fileUrl} download className="btn btn-primary">
                📥 Try Download Instead
              </a>
            </div>
          </div>
        );
      }
      return (
        <div className="video-viewer">
          <video
            ref={videoRef}
            controls
            className="video-content"
            onLoadedMetadata={(e) => {
              if (initialTimestamp) {
                e.target.currentTime = initialTimestamp;
                console.log('[DEBUG] Video seeking to timestamp:', initialTimestamp);
              }
              console.log('[FileViewer] Video loaded successfully:', fileUrl);
            }}
            onError={(e) => {
              console.error('[FileViewer] Video failed to load:', fileUrl, e);
              setVideoError(true);
            }}
          >
            <source src={fileUrl} type={`video/${fileExt === 'm4v' ? 'mp4' : fileExt}`} />
            Your browser does not support the video tag.
          </video>
          {onInsertLink && (
            <button className="btn-link-media" onClick={handleInsertVideoLink} title="Insert link to current timestamp">
              📌 Link to This Moment
            </button>
          )}
        </div>
      );
    }

    if (fileExt === 'pdf') {
      if (iframeError) {
        return (
          <div className="file-error">
            <h3>❌ Could Not Load PDF</h3>
            <p>The PDF file could not be loaded. Possible reasons:</p>
            <ul className="error-reasons">
              <li>Backend server is not running (check <code>http://localhost:8000</code>)</li>
              <li>PDF file was deleted from server</li>
              <li>Your browser's PDF viewer is disabled</li>
              <li>Network connection issue</li>
              <li>File path: <code>{note.file_path}</code></li>
            </ul>
            <div className="error-actions">
              <button onClick={() => setIframeError(false)} className="btn btn-secondary">
                🔄 Retry
              </button>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                🔗 Open in New Tab
              </a>
              <a href={fileUrl} download className="btn btn-primary">
                📥 Download PDF
              </a>
            </div>
          </div>
        );
      }
      return (
        <div className="pdf-viewer">
          <iframe
            key={pdfPage}
            src={`${fileUrl}#page=${pdfPage}`}
            className="file-iframe"
            title="PDF Viewer"
            onLoad={() => {
              console.log('[FileViewer] PDF loaded successfully:', fileUrl);
            }}
            onError={() => {
              console.error('[FileViewer] PDF iframe failed to load:', fileUrl);
              setIframeError(true);
            }}
          />
          {onInsertLink && (
            <div className="pdf-controls">
              <button
                className="btn-pdf-nav"
                onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
                title="Previous page"
              >
                ← Prev
              </button>
              <span className="pdf-page-indicator">Page {pdfPage}</span>
              <button
                className="btn-pdf-nav"
                onClick={() => setPdfPage(pdfPage + 1)}
                title="Next page"
              >
                Next →
              </button>
              <button className="btn-link-media" onClick={handleInsertPDFLink} title="Insert link to current page">
                📌 Link to This Page
              </button>
            </div>
          )}
        </div>
      );
    } else if (fileExt === 'ppt' || fileExt === 'pptx' || fileExt === 'doc' || fileExt === 'docx') {
      // Office files on localhost can't use Office Online viewer
      if (isLocalhost) {
        return (
          <div className="unsupported-file">
            <h3>📄 {fileExt.toUpperCase()} File</h3>
            <p>Preview not available for Office files on localhost.</p>
            <p className="file-info">To view this file:</p>
            <ul className="file-instructions">
              <li>Download the file using the button below</li>
              <li>Open it with Microsoft Office, LibreOffice, or Google Docs</li>
            </ul>
            {note.page_number && (
              <p className="page-reference">📍 Referenced Page/Slide: <strong>{note.page_number}</strong></p>
            )}
            <a href={fileUrl} download className="btn btn-primary">
              📥 Download {fileExt.toUpperCase()} File
            </a>
          </div>
        );
      } else {
        // For production (public URLs), use Office Online viewer
        const encodedUrl = encodeURIComponent(fileUrl);
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`}
            className="file-iframe"
            title="Office Viewer"
          />
        );
      }
    } else {
      return (
        <div className="unsupported-file">
          <p>Preview not available for this file type.</p>
          <a href={fileUrl} download className="btn btn-primary">
            📥 Download File
          </a>
        </div>
      );
    }
  };

  return (
    <>
      <div className="file-viewer-overlay" onClick={onClose}>
        <div className="file-viewer-modal" onClick={(e) => e.stopPropagation()}>
          <div className="file-viewer-header">
            <div>
              <h2>📂 {note.title}</h2>
              {note.page_number && (
                <span className="page-indicator">Page {note.page_number}</span>
              )}
            </div>
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="file-viewer-content">{renderViewer()}</div>

          <div className="file-viewer-footer">
            <a href={fileUrl} download className="btn btn-secondary">
              📥 Download
            </a>
            <button className="btn btn-primary" onClick={onClose}>
              ⬅ Back to Notes
            </button>
          </div>
        </div>
      </div>

      {showLinkModal && linkModalData && (
        <LinkTextModal
          mediaType={linkModalData.mediaType}
          mediaInfo={linkModalData.mediaInfo}
          filePath={linkModalData.filePath}
          selectedText={selectedText}
          onConfirm={handleLinkConfirm}
          onCancel={handleLinkCancel}
        />
      )}
    </>
  );
}

export default FileViewer;

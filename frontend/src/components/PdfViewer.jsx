import { useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './PdfViewer.css';

function PdfViewer({ fileUrl, initialPage = 1, initialAnchor = null, onPageChange, onInsertLink, isFullscreen }) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedText, setSelectedText] = useState('');

  // Create default layout plugin (includes toolbar, zoom, search, thumbnails, etc.)
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { toolbarPluginInstance } = defaultLayoutPluginInstance;
  const { jumpToPage } = toolbarPluginInstance.pageNavigationPluginInstance;

  // Jump to initial page ONCE when PDF loads
  useEffect(() => {
    if (totalPages > 0 && initialPage > 0 && initialPage <= totalPages) {
      // jumpToPage is 0-indexed
      jumpToPage(initialPage - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]); // Only run when totalPages is set (document loaded)

  // Handle document load success
  const handleDocumentLoad = (e) => {
    const numPages = e.doc.numPages;
    setTotalPages(numPages);
    console.log(`[PdfViewer] PDF loaded: ${numPages} pages`);
  };

  // Handle page change events (EVENT-DRIVEN - Zero CPU overhead!)
  const handlePageChange = (e) => {
    const newPage = e.currentPage + 1; // Convert from 0-indexed to 1-indexed
    setCurrentPage(newPage);
    
    if (onPageChange) {
      onPageChange(newPage);
    }
    
    console.log(`[PdfViewer] 📄 Page changed to ${newPage}`);
  };

  // Capture text selection in PDF
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        setSelectedText(text);
        console.log('[PdfViewer] Text selected:', text.substring(0, 50) + '...');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Handle link creation (with optional text anchor)
  const handleCreateLink = () => {
    if (onInsertLink) {
      // Pass current page, total pages, and selected text (if any)
      onInsertLink(currentPage, totalPages, selectedText);
    }
  };

  return (
    <div className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
        <div className="pdf-viewer-wrapper">
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            defaultScale={1.0}
            initialPage={initialPage - 1}
            {...(initialAnchor && { keyword: initialAnchor })}
          />
        </div>
      </Worker>

      {/* Custom Link Creation Controls Overlay */}
      {onInsertLink && (
        <div className={`pdf-controls-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
          <div className="pdf-controls-content">
            <div className="pdf-page-info">
              <span className="page-label">Current Page:</span>
              <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
              {selectedText && (
                <span className="selected-text-indicator" title={`Selected: "${selectedText.substring(0, 100)}..."`}>
                  📝
                </span>
              )}
            </div>
            <button
              className="btn-create-link"
              onClick={handleCreateLink}
              title={selectedText ? `Link to page ${currentPage} at: "${selectedText.substring(0, 50)}..."` : `Link to page ${currentPage}`}
            >
              📌 Link to {selectedText ? 'Text' : `Page ${currentPage}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfViewer;

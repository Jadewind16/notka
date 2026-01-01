import { useState, useEffect } from 'react';
import './LinkTextModal.css';

function LinkTextModal({ mediaType, mediaInfo, filePath, selectedText, onConfirm, onCancel }) {
  const [linkText, setLinkText] = useState('');
  const [selectedPage, setSelectedPage] = useState(mediaInfo.page || 1);
  const [selectedTimestamp, setSelectedTimestamp] = useState(mediaInfo.seconds || 0);

  useEffect(() => {
    // Pre-fill with selected text if available, otherwise use default
    if (selectedText) {
      setLinkText(selectedText);
    } else {
      // Generate default text based on media type
      if (mediaType === 'video') {
        setLinkText(`Timestamp ${mediaInfo.formatted}`);
      } else if (mediaType === 'pdf') {
        setLinkText(`Page ${selectedPage}`);
      } else if (mediaType === 'image') {
        setLinkText('Image');
      }
    }
  }, [mediaType, mediaInfo, selectedText, selectedPage]);

  const generatePreview = () => {
    if (mediaType === 'video') {
      return `[${linkText}](<file://${filePath}#t=${selectedTimestamp}>)`;
    } else if (mediaType === 'pdf') {
      return `[${linkText}](<file://${filePath}#page=${selectedPage}>)`;
    } else if (mediaType === 'image') {
      return `[${linkText}](<file://${filePath}>)`;
    }
    return '';
  };

  const formatTimestamp = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    const markdown = generatePreview();
    onConfirm(markdown);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="link-modal-overlay" onClick={onCancel}>
      <div className="link-modal" onClick={(e) => e.stopPropagation()}>
        <div className="link-modal-header">
          <h3>📌 Create Link</h3>
          <button className="btn-close-modal" onClick={onCancel}>✕</button>
        </div>

        <div className="link-modal-content">
          <div className="link-info">
            {mediaType === 'video' && (
              <div className="link-info-section">
                <p className="link-info-text">
                  🎥 Current timestamp: <strong>{mediaInfo.formatted}</strong>
                  {mediaInfo.duration && <span> (Total: {formatTimestamp(mediaInfo.duration)})</span>}
                </p>
                <div className="timestamp-controls">
                  <label htmlFor="timestamp-input">Link to timestamp (seconds):</label>
                  <div className="timestamp-input-group">
                    <input
                      id="timestamp-input"
                      type="number"
                      min="0"
                      max={mediaInfo.duration || undefined}
                      className="timestamp-input"
                      value={selectedTimestamp}
                      onChange={(e) => setSelectedTimestamp(parseInt(e.target.value) || 0)}
                    />
                    <span className="timestamp-display">{formatTimestamp(selectedTimestamp)}</span>
                  </div>
                </div>
              </div>
            )}
            {mediaType === 'pdf' && (
              <div className="link-info-section">
                <p className="link-info-text">
                  📄 Current page: <strong>{mediaInfo.page}</strong>
                  {mediaInfo.totalPages && <span> of {mediaInfo.totalPages}</span>}
                </p>
                <div className="page-controls">
                  <label htmlFor="page-input">Link to page:</label>
                  <div className="page-input-group">
                    <button
                      className="page-btn"
                      onClick={() => setSelectedPage(Math.max(1, selectedPage - 1))}
                      disabled={selectedPage <= 1}
                    >
                      ←
                    </button>
                    <input
                      id="page-input"
                      type="number"
                      min="1"
                      max={mediaInfo.totalPages || undefined}
                      className="page-input"
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(parseInt(e.target.value) || 1)}
                    />
                    <button
                      className="page-btn"
                      onClick={() => setSelectedPage(selectedPage + 1)}
                      disabled={mediaInfo.totalPages && selectedPage >= mediaInfo.totalPages}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
            {mediaType === 'image' && (
              <p className="link-info-text">
                🖼️ Image link
              </p>
            )}
          </div>

          <div className="link-text-input-group">
            <label htmlFor="link-text">Link Text:</label>
            <input
              id="link-text"
              type="text"
              className="link-text-input"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter text for the link..."
              autoFocus
            />
            <p className="link-hint">
              {selectedText ? '✓ Using selected text from your note' : 'Type a description for this link'}
            </p>
          </div>

          <div className="link-preview">
            <label>Preview:</label>
            <code className="link-preview-code">{generatePreview()}</code>
          </div>
        </div>

        <div className="link-modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!linkText.trim()}
          >
            Insert Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default LinkTextModal;

import { useState, useEffect } from 'react';
import './LinkTextModal.css';

function LinkTextModal({ mediaType, mediaInfo, filePath, selectedText, onConfirm, onCancel }) {
  const [linkText, setLinkText] = useState('');

  useEffect(() => {
    // Pre-fill with selected text if available, otherwise use default
    if (selectedText) {
      setLinkText(selectedText);
    } else {
      // Generate default text based on media type
      if (mediaType === 'video') {
        setLinkText(`Timestamp ${mediaInfo.formatted}`);
      } else if (mediaType === 'pdf') {
        setLinkText(`Page ${mediaInfo.page}`);
      } else if (mediaType === 'image') {
        setLinkText('Image');
      }
    }
  }, [mediaType, mediaInfo, selectedText]);

  const generatePreview = () => {
    if (mediaType === 'video') {
      return `[${linkText}](<file://${filePath}#t=${mediaInfo.seconds}>)`;
    } else if (mediaType === 'pdf') {
      return `[${linkText}](<file://${filePath}#page=${mediaInfo.page}>)`;
    } else if (mediaType === 'image') {
      return `[${linkText}](<file://${filePath}>)`;
    }
    return '';
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
              <p className="link-info-text">
                🎥 Video timestamp: <strong>{mediaInfo.formatted}</strong>
              </p>
            )}
            {mediaType === 'pdf' && (
              <p className="link-info-text">
                📄 PDF page: <strong>{mediaInfo.page}</strong>
              </p>
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

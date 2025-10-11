import { noteAPI } from '../services/api';
import './FileViewer.css';

function FileViewer({ note, onClose }) {
  const getFileExtension = (filePath) => {
    if (!filePath) return null;
    return filePath.split('.').pop().toLowerCase();
  };

  const fileExt = getFileExtension(note.file_path);
  const fileUrl = noteAPI.getFileUrl(note.file_path);
  const pageNumber = note.page_number || 1;

  const renderViewer = () => {
    if (fileExt === 'pdf') {
      return (
        <iframe
          src={`${fileUrl}#page=${pageNumber}`}
          className="file-iframe"
          title="PDF Viewer"
        />
      );
    } else if (fileExt === 'ppt' || fileExt === 'pptx') {
      // Use Microsoft Office Online Viewer
      const encodedUrl = encodeURIComponent(fileUrl);
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`}
          className="file-iframe"
          title="PowerPoint Viewer"
        />
      );
    } else if (fileExt === 'doc' || fileExt === 'docx') {
      const encodedUrl = encodeURIComponent(fileUrl);
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`}
          className="file-iframe"
          title="Word Viewer"
        />
      );
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
  );
}

export default FileViewer;

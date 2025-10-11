import { noteAPI } from '../services/api';
import './NoteCard.css';

function NoteCard({ note, onDelete, onViewFile }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileExtension = (filePath) => {
    if (!filePath) return null;
    return filePath.split('.').pop().toLowerCase();
  };

  const fileExt = getFileExtension(note.file_path);

  return (
    <div className="note-card">
      <div className="note-card-header">
        <h3>{note.title}</h3>
        <button
          className="btn-delete"
          onClick={() => onDelete(note._id)}
          title="Delete note"
        >
          🗑️
        </button>
      </div>

      <p className="note-content">{note.content}</p>

      <div className="note-metadata">
        <span className="note-date">{formatDate(note.created_at)}</span>
      </div>

      {note.file_path && (
        <div className="note-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onViewFile(note)}
          >
            📂 View File
          </button>

          {note.page_number && (
            <button
              className="btn btn-info"
              onClick={() => onViewFile(note)}
            >
              📄 Page {note.page_number}
            </button>
          )}

          {fileExt && (
            <span className="file-badge">{fileExt.toUpperCase()}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default NoteCard;

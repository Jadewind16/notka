import NoteCard from './NoteCard';
import './NoteList.css';

function NoteList({ notes, onDelete, onViewFile }) {
  if (notes.length === 0) {
    return (
      <div className="note-list-container">
        <h2>📌 Your Notes</h2>
        <p className="empty-message">No notes yet. Start adding some!</p>
      </div>
    );
  }

  return (
    <div className="note-list-container">
      <h2>📌 Your Notes ({notes.length})</h2>
      <div className="note-grid">
        {notes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            onDelete={onDelete}
            onViewFile={onViewFile}
          />
        ))}
      </div>
    </div>
  );
}

export default NoteList;

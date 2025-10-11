import { useState, useEffect } from 'react';
import { noteAPI } from './services/api';
import NoteForm from './components/NoteForm';
import NoteList from './components/NoteList';
import FileViewer from './components/FileViewer';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await noteAPI.getAllNotes();
      setNotes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      await noteAPI.createNote(noteData);
      await fetchNotes(); // Refresh the list
    } catch (err) {
      alert('Failed to create note: ' + err.message);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await noteAPI.deleteNote(id);
      await fetchNotes(); // Refresh the list
    } catch (err) {
      alert('Failed to delete note: ' + err.message);
    }
  };

  const handleViewFile = (note) => {
    setSelectedNote(note);
    setShowFileViewer(true);
  };

  const handleCloseFileViewer = () => {
    setShowFileViewer(false);
    setSelectedNote(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Notka</h1>
        <p>Your Study Note Manager</p>
      </header>

      <main className="app-main">
        <div className="container">
          <NoteForm onSubmit={handleCreateNote} />

          {loading && <div className="loading">Loading notes...</div>}
          {error && <div className="error">{error}</div>}

          {!loading && !error && (
            <NoteList
              notes={notes}
              onDelete={handleDeleteNote}
              onViewFile={handleViewFile}
            />
          )}
        </div>
      </main>

      {showFileViewer && selectedNote && (
        <FileViewer note={selectedNote} onClose={handleCloseFileViewer} />
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import NoteForm from '../components/NoteForm';
import NoteList from '../components/NoteList';
import FileViewer from '../components/FileViewer';
import { noteAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await noteAPI.getAllNotes();
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      alert('Failed to load notes. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      const createdNote = await noteAPI.createNote(noteData);
      setNotes([createdNote, ...notes]);
      alert('Note created successfully! 🎉');
    } catch (error) {
      console.error('Failed to create note:', error);
      alert(`Failed to create note: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await noteAPI.deleteNote(noteId);
      setNotes(notes.filter((note) => note._id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
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
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📝 Notka</h1>
          <p className="tagline">Your Smart Study Notes</p>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <NoteForm onSubmit={handleCreateNote} />

          {loading ? (
            <div className="loading-message">
              <p>Loading notes...</p>
            </div>
          ) : (
            <NoteList
              notes={notes}
              onDelete={handleDeleteNote}
              onViewFile={handleViewFile}
            />
          )}
        </div>
      </main>

      {showFileViewer && selectedNote && (
        <FileViewer
          note={selectedNote}
          onClose={handleCloseFileViewer}
        />
      )}
    </div>
  );
}

export default Dashboard;


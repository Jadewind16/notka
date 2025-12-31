import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = () => {
    // Load notebooks from localStorage
    const saved = localStorage.getItem('notebooks');
    if (saved) {
      setNotebooks(JSON.parse(saved));
    } else {
      // Create default notebook
      const defaultNotebook = {
        id: '1',
        name: 'My Study Notes',
        description: 'General study materials',
        color: '#667eea',
        createdAt: new Date().toISOString(),
      };
      setNotebooks([defaultNotebook]);
      localStorage.setItem('notebooks', JSON.stringify([defaultNotebook]));
    }
  };

  const handleCreateNotebook = () => {
    const name = prompt('Enter notebook name:');
    if (!name || !name.trim()) return;

    const description = prompt('Enter description (optional):') || '';

    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newNotebook = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      color: randomColor,
      createdAt: new Date().toISOString(),
    };

    const updated = [...notebooks, newNotebook];
    setNotebooks(updated);
    localStorage.setItem('notebooks', JSON.stringify(updated));
  };

  const handleDeleteNotebook = (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this notebook? Notes will remain accessible from other notebooks.')) return;

    const updated = notebooks.filter((nb) => nb.id !== id);
    setNotebooks(updated);
    localStorage.setItem('notebooks', JSON.stringify(updated));
  };

  const handleOpenNotebook = (id) => {
    navigate(`/notebook/${id}`);
  };

  return (
    <div className="homepage">
      <header className="homepage-header">
        <div className="header-content">
          <h1>📝 Notka</h1>
          <p className="tagline">Organize Your Study Notes</p>
        </div>
      </header>

      <main className="homepage-main">
        <div className="notebooks-container">
          <div className="notebooks-header">
            <h2>My Notebooks</h2>
            <button className="btn-create" onClick={handleCreateNotebook}>
              <Plus size={20} />
              New Notebook
            </button>
          </div>

          <div className="notebooks-grid">
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="notebook-card"
                style={{ borderTopColor: notebook.color }}
                onClick={() => handleOpenNotebook(notebook.id)}
              >
                <div className="notebook-icon" style={{ backgroundColor: `${notebook.color}20` }}>
                  <BookOpen size={40} style={{ color: notebook.color }} />
                </div>
                <h3>{notebook.name}</h3>
                <p className="notebook-description">{notebook.description}</p>
                <div className="notebook-meta">
                  <span className="notebook-date">
                    {new Date(notebook.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="btn-delete-notebook"
                  onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                  title="Delete notebook"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {notebooks.length === 0 && (
            <div className="empty-state">
              <BookOpen size={80} />
              <h3>No notebooks yet</h3>
              <p>Create your first notebook to start organizing your notes</p>
              <button className="btn-create-large" onClick={handleCreateNotebook}>
                <Plus size={20} />
                Create Notebook
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;



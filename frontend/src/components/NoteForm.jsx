import { useState } from 'react';
import './NoteForm.css';

function NoteForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    page_number: '',
    file: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0] || null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required!');
      return;
    }

    const noteData = {
      title: formData.title,
      content: formData.content,
    };

    if (formData.page_number) {
      noteData.page_number = parseInt(formData.page_number);
    }

    if (formData.file) {
      noteData.file = formData.file;
    }

    await onSubmit(noteData);

    // Reset form
    setFormData({
      title: '',
      content: '',
      page_number: '',
      file: null,
    });
    // Reset file input
    e.target.reset();
  };

  return (
    <div className="note-form-container">
      <h2>➕ Add a New Note</h2>
      <form onSubmit={handleSubmit} className="note-form">
        <div className="form-group">
          <input
            type="text"
            name="title"
            placeholder="Note Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <textarea
            name="content"
            placeholder="Write your note..."
            value={formData.content}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>📎 Upload a File (PDF, PPT, etc.)</label>
          <input
            type="file"
            name="file"
            onChange={handleFileChange}
            accept=".pdf,.ppt,.pptx,.doc,.docx"
          />
        </div>

        <div className="form-group">
          <label>📍 Link to Page/Slide Number</label>
          <input
            type="number"
            name="page_number"
            placeholder="Enter page/slide number"
            value={formData.page_number}
            onChange={handleChange}
            min="1"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          💾 Save Note
        </button>
      </form>
    </div>
  );
}

export default NoteForm;

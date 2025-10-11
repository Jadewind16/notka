import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const noteAPI = {
  // Get all notes
  getAllNotes: async () => {
    const response = await api.get('/api/notes/');
    return response.data;
  },

  // Get single note
  getNote: async (id) => {
    const response = await api.get(`/api/notes/${id}`);
    return response.data;
  },

  // Create note with optional file
  createNote: async (noteData) => {
    const formData = new FormData();
    formData.append('title', noteData.title);
    formData.append('content', noteData.content);

    if (noteData.page_number) {
      formData.append('page_number', noteData.page_number);
    }

    if (noteData.file) {
      formData.append('file', noteData.file);
    }

    const response = await api.post('/api/notes/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update note
  updateNote: async (id, noteData) => {
    const response = await api.put(`/api/notes/${id}`, noteData);
    return response.data;
  },

  // Delete note
  deleteNote: async (id) => {
    await api.delete(`/api/notes/${id}`);
  },

  // Get file URL for a note
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    return `${API_BASE_URL}/${filePath}`;
  },
};

export default api;

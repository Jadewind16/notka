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

  // Add file to existing note
  addFileToNote: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/notes/${id}/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a specific file from a note
  deleteFileFromNote: async (id, filePath) => {
    const response = await api.delete(`/api/notes/${id}/file`, {
      data: { file_path: filePath }
    });
    return response.data;
  },

  // Delete note
  deleteNote: async (id) => {
    await api.delete(`/api/notes/${id}`);
  },

  // Get file URL for a note
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    // Normalize path: remove '../' prefix if present (for backward compatibility)
    // This handles both old '../uploads/...' and new 'uploads/...' paths
    let normalizedPath = filePath;
    if (normalizedPath.startsWith('../')) {
      normalizedPath = normalizedPath.substring(3);
    }
    // Remove 'uploads/' prefix since the new endpoint adds it automatically
    if (normalizedPath.startsWith('uploads/')) {
      normalizedPath = normalizedPath.substring(8);
    }
    // Use the new Range-supporting endpoint for video seeking
    return `${API_BASE_URL}/api/notes/serve/${normalizedPath}`;
  },
};

export default api;

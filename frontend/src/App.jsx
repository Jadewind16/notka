import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NotebookPage from './pages/NotebookPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notebook/:notebookId" element={<NotebookPage />} />
      </Routes>
    </Router>
  );
}

export default App;

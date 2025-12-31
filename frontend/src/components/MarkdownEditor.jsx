import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Code } from 'lucide-react';
import './MarkdownEditor.css';

function MarkdownEditor({ content, onChange, readOnly = false }) {
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'

  // Custom component to render images as videos if the src is a video file
  const components = {
    img: ({ node, src, alt, ...props }) => {
      // Clean the src - remove angle brackets if present
      let cleanSrc = src;
      if (src?.startsWith('<') && src?.endsWith('>')) {
        cleanSrc = src.slice(1, -1);
      }

      // Check if src is a video file
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
      const fileExt = cleanSrc?.split('.').pop()?.toLowerCase();

      if (videoExtensions.includes(fileExt)) {
        // Render as video player
        return (
          <div className="markdown-video">
            <video controls style={{ maxWidth: '100%', maxHeight: '500px' }}>
              <source src={cleanSrc} type={`video/${fileExt === 'm4v' ? 'mp4' : fileExt}`} />
              Your browser does not support the video tag.
            </video>
            {alt && <p className="video-caption">{alt}</p>}
          </div>
        );
      }

      // Render as normal image
      return <img src={cleanSrc} alt={alt} {...props} />;
    },
  };

  if (readOnly) {
    return (
      <div className="markdown-editor">
        <div className="preview-pane">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
            className="markdown-content"
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-editor">
      <div className="editor-toolbar">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'edit' ? 'active' : ''}
            onClick={() => setViewMode('edit')}
            title="Edit mode"
          >
            <Code size={18} />
            Edit
          </button>
          <button
            className={viewMode === 'split' ? 'active' : ''}
            onClick={() => setViewMode('split')}
            title="Split mode"
          >
            Split
          </button>
          <button
            className={viewMode === 'preview' ? 'active' : ''}
            onClick={() => setViewMode('preview')}
            title="Preview mode"
          >
            <Eye size={18} />
            Preview
          </button>
        </div>
      </div>

      <div className={`editor-container ${viewMode}`}>
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="edit-pane">
            <textarea
              className="markdown-input"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="# Start writing...\n\nUse **markdown** syntax for formatting.\n\n- Lists\n- **Bold** and *italic*\n- [Links](<url>)\n- ![Images](<file.jpg>)\n- ![Videos](<file.mp4>)\n- `code`"
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="preview-pane">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
              className="markdown-content"
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;

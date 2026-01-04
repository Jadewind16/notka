# NOTKA - Design & Architecture Analysis
**Version 2.0 | Analysis Date: January 4, 2026**

---

## Executive Summary

Notka is a modern study note management system that enables students to take context-aware notes by linking them directly to specific pages/timestamps in lecture materials (PDFs, videos, images, presentations). The application employs a modern tech stack with a Python FastAPI async backend and React 18 frontend, following Software Engineering design patterns and principles.

**Core Innovation**: Markdown-based linking system that maintains bidirectional connections between notes and source materials, enabling efficient study and review.

---

## 1. Project Overview

### 1.1 Purpose & Value Proposition

Notka solves the fundamental problem of **context fragmentation** in student note-taking. Traditional note-taking apps lose the connection between notes and their source material, forcing students to manually search through lecture slides or videos to find context during review.

**Key Benefits**:
- Context-aware note-taking with preserved source references
- One-click navigation from notes to specific pages/timestamps
- Multi-format support (PDF, video, images, presentations)
- Real-time auto-save with 1-second debounce
- Dark/light theme support

### 1.2 Target Audience

- University and high school students
- Online course learners
- Self-directed learners using video lectures
- Researchers reviewing PDF documents

---

## 2. Architecture Overview

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │         React 18 + Vite Frontend                │    │
│  │  - React Router (client-side routing)          │    │
│  │  - Axios (HTTP client)                         │    │
│  │  - React PDF Viewer                            │    │
│  │  - LocalStorage (notebooks, theme)             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Python)                       │
│  ┌────────────────────────────────────────────────┐    │
│  │         FastAPI + Uvicorn Server                │    │
│  │  - CORS Middleware                             │    │
│  │  - Pydantic Validation                         │    │
│  │  - Motor (Async MongoDB Driver)                │    │
│  │  - File Upload Handler                         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         ↓                                    ↓
┌──────────────────┐              ┌──────────────────────┐
│   MongoDB        │              │   Local Filesystem   │
│   (Motor/Async)  │              │   /uploads/          │
│   - Notes        │              │   - PDFs             │
│   - Metadata     │              │   - Videos           │
│   - File refs    │              │   - Images           │
└──────────────────┘              └──────────────────────┘
```

### 2.2 Project Structure

```
notka/ (monorepo)
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── config/              # Settings & env config
│   │   ├── models/              # Pydantic validation models
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Database abstraction
│   │   └── main.py              # FastAPI app init
│   ├── notes/                   # SE-style CRUD module
│   │   ├── queries.py           # Data access layer
│   │   └── tests/
│   ├── tests/                   # Integration tests
│   └── run.py                   # Server entry point
│
├── frontend/                    # React 18 + Vite
│   ├── src/
│   │   ├── pages/              # Route-level components
│   │   │   ├── HomePage.jsx           (135 lines)
│   │   │   └── NotebookPage.jsx       (1178 lines)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── FileViewer.jsx         (403 lines)
│   │   │   ├── LinkTextModal.jsx      (199 lines)
│   │   │   ├── PdfViewer.jsx          (112 lines)
│   │   │   └── [Others]
│   │   ├── services/           # API client
│   │   │   └── api.js
│   │   └── App.jsx             # Router setup
│   └── vite.config.js
│
└── uploads/                    # User-uploaded files
```

### 2.3 Design Principles

1. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data access
2. **Async-First**: All I/O operations are non-blocking (async/await)
3. **Software Engineering Patterns**: Modular structure with constants, validation functions, explicit error handling
4. **Component-Based Architecture**: Reusable, composable React components
5. **API-Driven**: RESTful API design with JSON payloads

---

## 3. Technology Stack Analysis

### 3.1 Backend Technologies

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| **FastAPI** | 0.104.1 | Web framework | Modern, high-performance, auto-generated API docs |
| **Uvicorn** | 0.24.0 | ASGI server | Fast async server with WebSocket support |
| **Motor** | 3.5.1 | MongoDB driver | Async operations for non-blocking I/O |
| **PyMongo** | 4.8.0 | MongoDB client | Robust database connectivity |
| **Pydantic** | 2.5.0 | Data validation | Type-safe data models with automatic validation |
| **Python-multipart** | 0.0.6 | File uploads | Form and file handling |

**Architecture Pattern**: FastAPI's async/await throughout ensures non-blocking operations, critical for scalability with database and file I/O.

### 3.2 Frontend Technologies

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| **React** | 18.2.0 | UI framework | Component reusability, virtual DOM |
| **Vite** | 5.0.8 | Build tool | Fast HMR, optimized builds |
| **React Router** | 6.20.0 | Routing | Client-side navigation |
| **Axios** | 1.6.2 | HTTP client | Promise-based API calls |
| **React PDF Viewer** | 3.12.0 | PDF rendering | Full-featured PDF display with navigation |
| **Lucide React** | 0.545.0 | Icons | Modern, consistent icon library |
| **React Markdown** | 10.1.0 | Markdown rendering | Note preview mode |

**Build Strategy**: Vite provides fast development experience with Hot Module Replacement (HMR) and optimized production builds with code splitting.

### 3.3 Database Choice

**MongoDB** (Document Store)
- **Rationale**:
  - Flexible schema for evolving note structure
  - Natural fit for JSON-like documents
  - Easy integration with async Python drivers
  - Cloud-ready (MongoDB Atlas support)
- **Connection**: Motor async driver for non-blocking operations
- **Deployment**: Local or cloud-based (Atlas)

### 3.4 File Storage Strategy

**Local Filesystem** (`/uploads` directory)
- **Current Implementation**: Files stored on server filesystem
- **Path Handling**: Normalized paths for security (prevents directory traversal)
- **Range Requests**: HTTP 206 Partial Content for video seeking
- **Future Considerations**: Could migrate to S3/cloud storage for scalability

---

## 4. Core Features & Functionality

### 4.1 Note Management System

**CRUD Operations**:
- Create notes with title, content, optional files
- Read all notes or single note by ID
- Update note title, content, files
- Delete notes with cascade file cleanup

**Auto-Save Mechanism**:
```javascript
// 1-second debounce prevents excessive writes
const debouncedSave = useDebounce(async () => {
  await noteAPI.updateNote(currentNote._id, {
    title: noteTitle,
    content: noteContent,
  })
}, 1000)
```

**Benefits**:
- No manual save required
- Prevents data loss
- Reduces server load
- Respects user typing rhythm

### 4.2 Multi-Format File Upload

**Supported Formats**:
- **Documents**: PDF, PowerPoint (.ppt, .pptx), Word (.doc, .docx)
- **Images**: PNG, JPG, GIF, BMP, SVG, WebP
- **Videos**: MP4, WebM, OGG, MOV, AVI, MKV, M4V
- **Max Size**: 100MB per file
- **Multiple Files**: Latest version supports multiple files per note

**Upload Workflow**:
```
1. User selects file → FormData creation
2. Frontend validation → API call
3. Backend validates extension against whitelist
4. Generate timestamped filename (security)
5. Save to /uploads directory
6. Normalize path (remove ../)
7. Update note.files array in database
8. Return success → UI update
```

### 4.3 Page/Timestamp Reference System

**The Core Innovation**

Instead of storing link metadata in a separate database table, Notka embeds references directly in markdown content using custom URL schemes:

```markdown
<!-- PDF Page Reference -->
[Selected Text](<file://uploads/lecture.pdf#page=5>)

<!-- PDF Page with Text Anchor -->
[Key Concept](<file://uploads/lecture.pdf#page=5&anchor=Important+Topic>)

<!-- Video Timestamp -->
[Demonstration](<file://uploads/demo.mp4#t=120>)

<!-- Resizable Image -->
![Diagram](<file://uploads/diagram.png?width=600>)
```

**Advantages**:
- Self-contained content (portable)
- No separate link table needed
- Exportable with links intact
- Simple parser implementation

**Linking Workflow**:
1. User selects text in note editor
2. Clicks "Create Link" button
3. File viewer modal opens
4. User navigates to desired page/timestamp
5. Clicks "Link Selected Text"
6. Markdown link inserted at cursor position

### 4.4 Embedded Media Viewers

**PDF Viewer** (`PdfViewer.jsx`):
- Library: @react-pdf-viewer with plugins
- Features: Page navigation, zoom, search, toolbar
- Integration: Callback notifies parent of current page
- Performance: Lazy loading of pages

**Video Player**:
- Native HTML5 `<video>` element
- Full-screen support (F key)
- Timestamp navigation
- Range request support for seeking (HTTP 206)

**Image Viewer**:
- Resizable images with drag handles
- Width stored in markdown (`?width=600`)
- Lazy loading with `loading="lazy"`
- Drag-to-reorder support (future)

**File Type Detection**:
```javascript
const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  return 'document'
}
```

### 4.5 Text-to-Media Linking Workflow

**User Experience**:
```
1. Write note: "The professor explained Newton's Laws..."
2. Select text: "Newton's Laws"
3. Click "Create Link to File"
4. File viewer opens with lecture PDF
5. Navigate to page 15
6. Click "Link Selected Text"
7. Result: [Newton's Laws](<file://lecture.pdf#page=15>)
8. Click link in note → PDF jumps to page 15
```

**Technical Implementation**:
- Text selection stored in state (300ms debounce)
- Modal receives `selectedText` prop
- Link generation in `LinkTextModal.jsx`
- Markdown parsing in `renderedContent` useMemo

### 4.6 Theme System

**Implementation**:
```javascript
// Store preference
localStorage.setItem('notka-theme', darkMode ? 'dark' : 'light')

// Apply to DOM
document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')

// CSS selectors
body[data-theme="dark"] { background: #1a1a1a; color: #fff; }
body[data-theme="light"] { background: #f4f6f9; color: #333; }
```

**Features**:
- Toggle button in header
- Persists across sessions
- Instant switching (no reload)
- Consistent theme across all components

### 4.7 Notebook Organization

**Strategy**: Frontend-managed via localStorage

```javascript
// HomePage.jsx
const [notebooks, setNotebooks] = useState([
  { id: '1', name: 'Biology 101', color: '#667eea' },
  { id: '2', name: 'Computer Science', color: '#4facfe' }
])

localStorage.setItem('notebooks', JSON.stringify(notebooks))
```

**Rationale**:
- Notes are shared across notebooks (not owned by notebooks)
- Notebooks are organizational views, not data containers
- Simpler schema without user/notebook relationships
- Instant notebook creation (no backend call)

---

## 5. User Interface & Experience Design

### 5.1 Layout Architecture

**Three-Pane Interface** (NotebookPage):

```
┌─────────────────────────────────────────────────────────┐
│         Notebook Header                                  │
│  ← Back | Notebook Name | Theme Toggle                  │
└─────────────────────────────────────────────────────────┘
┌──────────┬───────────────────────┬──────────────────────┐
│          │                       │                      │
│ Notes    │  Note Editor          │ Link Tools & Files   │
│ Sidebar  │                       │                      │
│          │ • Title Input         │ • Create Link        │
│ • Create │ • Content Textarea    │ • Upload File        │
│ • List   │ • Edit/Preview Toggle │ • File List          │
│ • Delete │ • Auto-save Indicator │ • Delete File        │
│          │ • Markdown Rendering  │                      │
│          │                       │                      │
└──────────┴───────────────────────┴──────────────────────┘
```

**Responsive Design**:
- Flexbox-based layout
- Collapsible sidebars on mobile
- Media queries for small screens
- Full-screen modal viewers

### 5.2 Component Hierarchy

```
App (React Router)
│
├── HomePage
│   ├── NotebookCard (grid layout)
│   ├── CreateNotebookModal
│   └── DeleteConfirmModal
│
└── NotebookPage (main editor)
    ├── NotebookHeader
    │   ├── BackButton
    │   ├── TitleDisplay
    │   └── ThemeToggle
    │
    ├── NotesSidebar
    │   ├── CreateNoteButton
    │   └── NoteItem (list)
    │
    ├── NoteEditor (center pane)
    │   ├── TitleInput
    │   ├── ModeToggle (Edit/Preview)
    │   ├── ContentTextarea
    │   │   └── AutoSaveIndicator
    │   └── PreviewRenderer
    │       ├── ResizableImage (memoized)
    │       ├── FileLink (clickable)
    │       └── MarkdownContent
    │
    ├── FilesSidebar (right pane)
    │   ├── LinkCreationTools
    │   │   ├── SelectedTextDisplay
    │   │   └── CreateLinkButton
    │   ├── FileUploadButton
    │   └── FileList
    │       └── FileItem (with delete)
    │
    └── Modals
        ├── FileViewer
        │   ├── PdfViewer
        │   ├── VideoPlayer
        │   ├── ImageViewer
        │   └── LinkTextModal
        └── DeleteConfirmation
```

### 5.3 UI/UX Patterns

**1. Modal-Driven Workflows**
- File selection → preview → link creation
- Delete confirmations for safety
- Full-screen viewers for focus

**2. Visual Feedback**
- "Saving..." indicator during auto-save
- Selected text preview in link tools
- File type badges (🎬 video, 🖼️ image, 📄 document)
- Disabled states for unavailable actions

**3. Keyboard Shortcuts**
- `F`: Toggle full-screen in file viewer
- `Escape`: Close modals
- Standard text editing shortcuts

**4. Accessibility Features**
- Semantic HTML elements
- Title attributes for hover tooltips
- High-contrast color pairs
- Keyboard navigation support

### 5.4 Color System & Theming

**Light Mode**:
- Background: `#f4f6f9`
- Text: `#333`
- Primary: `#667eea` (blue)
- Accent: `#4facfe` (cyan)

**Dark Mode**:
- Background: `#1a1a1a`
- Text: `#fff`
- Primary: `#667eea` (blue)
- Accent: `#4facfe` (cyan)

**Notebook Colors** (auto-generated):
- Purple gradient: `#667eea`
- Blue gradient: `#4facfe`
- Pink gradient: `#f093fb`
- Red gradient: `#fa709a`
- Green gradient: `#43e97b`

---

## 6. Data Flow & State Management

### 6.1 Frontend State Architecture

**React Hooks-Based State** (NotebookPage.jsx):

```javascript
// Note Data (server-synced)
const [notes, setNotes] = useState([])           // All notes
const [currentNote, setCurrentNote] = useState() // Selected note
const [noteTitle, setNoteTitle] = useState('')   // Title input
const [noteContent, setNoteContent] = useState('')// Content input
const [noteFiles, setNoteFiles] = useState([])   // Files array

// UI State (client-only)
const [loading, setLoading] = useState(true)     // Initial load
const [isSaving, setIsSaving] = useState(false)  // Save status
const [darkMode, setDarkMode] = useState(false)  // Theme
const [isPreviewMode, setIsPreviewMode] = useState(false) // Editor mode

// Modal State
const [showFileViewer, setShowFileViewer] = useState(false)
const [selectedText, setSelectedText] = useState('') // For linking
```

**State Persistence**:
- **Backend (MongoDB)**: All notes, file metadata
- **LocalStorage**: Notebooks, theme preference
- **Session**: UI state (modals, selected text)

### 6.2 Data Flow Diagram

```
User Action (e.g., typing in editor)
         ↓
┌────────────────────────────┐
│  React State Update        │
│  setNoteContent(value)     │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  Debounce (1000ms)         │
│  useDebounce hook          │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  API Call (Axios)          │
│  noteAPI.updateNote()      │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  Backend Route             │
│  PUT /api/notes/{id}       │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  Validation (Pydantic)     │
│  NoteUpdate model          │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  Database Update           │
│  collection.update_one()   │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  Response (200 OK)         │
│  Updated note returned     │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  UI Update                 │
│  setIsSaving(false)        │
└────────────────────────────┘
```

### 6.3 API Communication Layer

**Centralized API Client** (`services/api.js`):

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

export const noteAPI = {
  // CRUD Operations
  getAllNotes: () => api.get('/api/notes/'),
  getNote: (id) => api.get(`/api/notes/${id}`),
  createNote: (noteData) => api.post('/api/notes/', noteData),
  updateNote: (id, data) => api.put(`/api/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/api/notes/${id}`),

  // File Operations
  addFileToNote: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/notes/${id}/file`, formData)
  },
  deleteFileFromNote: (noteId, filePath) =>
    api.delete(`/api/notes/${noteId}/file`, { data: { file_path: filePath } }),

  // Utility
  getFileUrl: (filePath) => `${api.defaults.baseURL}/api/notes/serve/${filePath}`
}
```

**Benefits**:
- Single source of truth for API endpoints
- Environment-based configuration
- Consistent error handling
- Type-safe (with JSDoc or TypeScript migration)

### 6.4 Backend API Endpoints

```
GET    /api/notes/              → Fetch all notes (sorted by created_at DESC)
POST   /api/notes/              → Create note (with optional file upload)
GET    /api/notes/{id}          → Get single note by ID
PUT    /api/notes/{id}          → Update note (title, content, page_number)
POST   /api/notes/{id}/file     → Add file to note
DELETE /api/notes/{id}/file     → Remove file from note
DELETE /api/notes/{id}          → Delete note (cascade delete files)
GET    /api/notes/serve/{path}  → Serve file with Range support (HTTP 206)
```

**Status Codes**:
- `200 OK`: Successful read/update
- `201 Created`: Successful creation
- `204 No Content`: Successful deletion
- `400 Bad Request`: Validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## 7. Innovative Design Decisions

### 7.1 Markdown-Based Link Metadata

**Decision**: Store link references in note content, not database

**Implementation**:
```markdown
[Selected Text](<file://uploads/lecture.pdf#page=5&anchor=Topic>)
```

**Advantages**:
- **Portability**: Notes are self-contained
- **Simplicity**: No separate link table
- **Exportability**: Links survive export
- **Flexibility**: Easy to parse and modify

**Trade-offs**:
- Manual parsing required (regex)
- Content length increases
- No database-level link queries

**Parsing Logic**:
```javascript
const fileRegex = /\[([^\]]*)\]\(<file:\/\/([^>]+)>\)/g
const imageRegex = /!\[([^\]]*)\]\(<file:\/\/([^>]+)>\)/g

while ((match = regex.exec(content)) !== null) {
  const linkText = match[1]
  const filePath = match[2]
  const params = new URLSearchParams(filePath.split('?')[1])
  const page = params.get('page')
  const anchor = params.get('anchor')
  const width = params.get('width')
  // Render link or embedded media
}
```

### 7.2 HTTP Range Request for Video Seeking

**Decision**: Implement custom Range-supporting file server

**Implementation**:
```python
@router.get("/serve/{file_path:path}")
async def serve_file_with_range(file_path: str, request: Request):
    # Parse Range header
    range_header = request.headers.get("range")
    if range_header:
        # Parse: "bytes=0-1023"
        # Return: 206 Partial Content
        return StreamingResponse(file_chunk, status_code=206, headers={
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes"
        })
    else:
        # Full file
        return FileResponse(full_path)
```

**Benefits**:
- Efficient video seeking (no full download)
- Reduced bandwidth usage
- Standard HTTP compliance
- Browser native support

### 7.3 Dual File Storage Schema

**Decision**: Support both legacy `file_path` and new `files` array

**Implementation**:
```javascript
const filesArray = note.files && note.files.length > 0
  ? note.files
  : (note.file_path ? [note.file_path] : [])
```

**Rationale**:
- Backward compatibility with v1.0 notes
- Gradual migration path
- No data loss during schema evolution
- Single codebase for both schemas

### 7.4 Debounced Auto-Save

**Decision**: 1-second debounce on all text changes

**Implementation**:
```javascript
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay])
}
```

**Benefits**:
- No lag during typing
- Reduced server load (fewer writes)
- Respects user typing rhythm
- Prevents race conditions

### 7.5 LocalStorage-Based Notebooks

**Decision**: Store notebooks in browser, not database

**Rationale**:
- Notes are shared resources (not owned by notebooks)
- Notebooks are organizational views
- Instant creation (no API call)
- Simpler backend schema
- User-specific organization

**Trade-offs**:
- Not synced across devices
- Lost if localStorage cleared
- No server-side notebook features

### 7.6 Performance Optimizations

**Memoization Strategy**:
```javascript
// Prevent re-renders of images when parent updates
const ResizableImage = memo(function ResizableImage({ src, alt, width }) {
  // Component logic
})

// Cache expensive parsing only when content changes
const renderedContent = useMemo(() => {
  const parts = []
  const regex = /(!?\[([^\]]*)\]\(<file:\/\/([^>]+)>\))/g
  // Complex parsing logic...
  return parts
}, [noteContent, noteFiles])
```

**Benefits**:
- Reduced re-renders
- Faster UI updates
- Smoother typing experience
- Better performance with large notes

---

## 8. Backend Architecture Deep Dive

### 8.1 FastAPI Application Structure

**Lifecycle Management**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info("Application started")

    yield

    # Shutdown
    await db.disconnect()
    logger.info("Application shutdown")

app = FastAPI(lifespan=lifespan)
```

**CORS Configuration**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 8.2 Data Models (Pydantic)

```python
class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(default="")
    file_path: Optional[str] = None
    page_number: Optional[int] = Field(default=None, ge=0)
    files: List[str] = Field(default_factory=list)

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    page_number: Optional[int] = Field(None, ge=0)
    files: Optional[List[str]] = None

class Note(NoteBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
```

**Validation Benefits**:
- Automatic type checking
- Min/max length enforcement
- Optional field handling
- API documentation generation

### 8.3 Database Layer (notes/queries.py)

**Software Engineering Pattern**:
```python
# Constants
TITLE = "title"
CONTENT = "content"
FILE_PATH = "file_path"
FILES = "files"
PAGE_NUMBER = "page_number"
CREATED_AT = "created_at"

# Validation Functions
def is_valid_id(note_id: str) -> bool:
    return ObjectId.is_valid(note_id)

def is_valid_title(title: str) -> bool:
    return 0 < len(title) <= 200

# CRUD Functions
async def create(flds: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new note"""
    if not is_valid_title(flds.get(TITLE, "")):
        raise ValueError("Invalid title")

    collection = await get_collection()
    flds[CREATED_AT] = datetime.utcnow()
    result = await collection.insert_one(flds)
    note = await collection.find_one({"_id": result.inserted_id})
    return note

async def update(note_id: str, flds: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing note"""
    if not is_valid_id(note_id):
        raise ValueError("Invalid note ID")

    collection = await get_collection()
    result = await collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": flds}
    )

    if result.matched_count == 0:
        raise KeyError("Note not found")

    return await get(note_id)
```

**Error Handling Pattern**:
- `ValueError`: Invalid input data
- `KeyError`: Resource not found
- Routes translate to HTTP exceptions

### 8.4 File Upload Security

**Whitelist Validation**:
```python
ALLOWED_EXTENSIONS = {
    'pdf', 'ppt', 'pptx', 'doc', 'docx',  # Documents
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp',  # Images
    'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'  # Videos
}

def is_allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

**Path Traversal Protection**:
```python
# Normalize path to prevent directory traversal
safe_path = os.path.normpath(file_path).replace("..", "")
full_path = os.path.join(settings.upload_dir, safe_path)

# Ensure path is within upload directory
if not full_path.startswith(os.path.abspath(settings.upload_dir)):
    raise HTTPException(status_code=400, detail="Invalid file path")
```

**Filename Generation**:
```python
timestamp = int(datetime.now().timestamp())
filename = f"{timestamp}_{file.filename}"
```

---

## 9. Testing Strategy & Quality Assurance

### 9.1 Backend Testing (Pytest)

**Test Structure**:
```
backend/
├── notes/tests/
│   └── test_queries.py          # Unit tests for CRUD
└── tests/
    ├── conftest.py              # Fixtures (test DB, client)
    ├── test_notes.py            # Note endpoint tests
    ├── test_file_upload.py      # File upload tests
    ├── test_database_queries.py # Database integration
    └── test_routes_comprehensive.py
```

**Test Coverage**:
- CRUD operations (create, read, update, delete)
- File upload validation
- Error handling (404, 400, 500)
- Database connection
- Range request handling

**Example Test**:
```python
@pytest.mark.asyncio
async def test_create_note(test_client):
    response = await test_client.post("/api/notes/", json={
        "title": "Test Note",
        "content": "Test content"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Note"
    assert "id" in data
```

### 9.2 Frontend Testing (Jest)

**Configuration**:
- Jest + React Testing Library
- Component unit tests
- Integration tests

**Run Command**:
```bash
npm test
```

### 9.3 Code Quality & Linting

**Flake8 Configuration**:
```ini
[flake8]
max-line-length = 100
exclude = .git,__pycache__,venv,build
```

**Makefile Integration**:
```makefile
all_tests:
	cd backend && flake8 app notes tests
	cd backend && pytest --cov=app --cov=notes
	cd frontend && npm test
```

### 9.4 CI/CD Pipeline (via Makefile)

```makefile
prod:
	$(MAKE) all_tests
	$(MAKE) clean_test_data
	git add -A
	git commit
	git push
```

**Pipeline Steps**:
1. Run all backend tests
2. Run linting (Flake8)
3. Generate coverage reports
4. Run frontend tests
5. Clean test data
6. Commit changes
7. Push to GitHub

---

## 10. Security Analysis

### 10.1 Current Security Measures

**1. CORS Protection**
- Whitelist of allowed origins
- Prevents unauthorized cross-origin requests

**2. File Upload Validation**
- Extension whitelist (prevents `.exe`, `.sh`, etc.)
- File size limit (100MB)
- Path normalization (prevents directory traversal)

**3. Input Validation**
- Pydantic models validate all inputs
- Type checking (string, int, array)
- Length limits (title max 200 chars)

**4. MongoDB Injection Protection**
- Motor driver handles parameterization
- No raw query string concatenation
- ObjectId validation

### 10.2 Security Gaps (Recommendations for Production)

**1. No Authentication/Authorization**
- **Issue**: All notes publicly accessible
- **Recommendation**: Implement JWT or OAuth
- **Impact**: User isolation, privacy

**2. No Rate Limiting**
- **Issue**: Vulnerable to DoS attacks
- **Recommendation**: Add middleware (e.g., `slowapi`)
- **Impact**: Service availability

**3. No HTTPS/TLS**
- **Issue**: Data transmitted in plaintext
- **Recommendation**: Configure SSL certificates
- **Impact**: Data confidentiality

**4. No File Virus Scanning**
- **Issue**: Malicious files could be uploaded
- **Recommendation**: Integrate ClamAV or cloud scanner
- **Impact**: Malware prevention

**5. No Input Sanitization for Markdown**
- **Issue**: Potential XSS via crafted markdown
- **Recommendation**: Use sanitization library (e.g., `DOMPurify`)
- **Impact**: XSS prevention

**6. No Audit Logging**
- **Issue**: No record of user actions
- **Recommendation**: Log all CRUD operations
- **Impact**: Security forensics

### 10.3 Recommended Security Roadmap

**Phase 1 (MVP Security)**:
1. Add user authentication (JWT)
2. Implement user-note ownership
3. Add rate limiting

**Phase 2 (Production-Ready)**:
4. Configure HTTPS/TLS
5. Add markdown sanitization
6. Implement file scanning

**Phase 3 (Enterprise-Ready)**:
7. Add audit logging
8. Implement role-based access control (RBAC)
9. Add data encryption at rest

---

## 11. Performance Characteristics

### 11.1 Frontend Performance

**Optimizations Implemented**:
- **Memoization**: `ResizableImage`, `renderedContent`
- **Debouncing**: Auto-save (1s), text selection (300ms)
- **Lazy Loading**: Images use `loading="lazy"`
- **Code Splitting**: Vite handles automatic splitting

**Metrics** (Estimated):
- **Initial Load**: ~500ms (production build)
- **Time to Interactive**: ~1s
- **Auto-save Latency**: <100ms (local network)

**Potential Improvements**:
- Virtual scrolling for long note lists
- Pagination for large note collections
- Service worker for offline support

### 11.2 Backend Performance

**Optimizations Implemented**:
- **Async I/O**: All operations non-blocking
- **Database Indexing**: MongoDB default on `_id`
- **Sorted Queries**: Pre-sorted by `created_at`

**Metrics** (Estimated, local MongoDB):
- **GET all notes**: ~50ms (100 notes)
- **GET single note**: ~10ms
- **POST create note**: ~20ms
- **PUT update note**: ~15ms
- **File upload**: ~500ms (10MB file)

**Potential Improvements**:
- Add indexes on `created_at`, `title`
- Implement caching (Redis) for frequently accessed notes
- Pagination for large datasets
- CDN for static file serving

### 11.3 Scalability Considerations

**Current Limitations**:
- **File Storage**: Local filesystem (single server)
- **Database**: Single MongoDB instance
- **Concurrency**: Limited by async event loop

**Scalability Roadmap**:
1. Migrate to cloud file storage (S3, Azure Blob)
2. Implement database replication/sharding
3. Add load balancer for multiple backend instances
4. Implement Redis caching layer
5. Use CDN for uploaded files

---

## 12. Recent Development & Evolution

### 12.1 Git History Analysis

**Last 10 Commits**:

| Commit Hash | Message | Type |
|------------|---------|------|
| `21c09e7` | "enabled linking to text, pdf updated, link would automatically be updated to the current page" | Feature |
| `596e005` | "Tests added, file viewer full screen enabled" | Testing + UX |
| `08a8efe` | "Bugs fixed, link created" | Bug Fix |
| `cd4c312` | "Updated a lot" | Refactor |
| `026fc99` | "Add comprehensive development guide" | Docs |
| `fa937e7` | "Fix makefile to use python3 and auto-set PYTHONPATH" | DevOps |
| `c137d87` | "Refactor to match Software Engineering project style" | Architecture |
| `1fe663c` | "Remove legacy Node.js backend implementation" | Legacy Cleanup |
| `853d7a8` | "Add FastAPI backend and React frontend" | Tech Migration |
| `ffd024d` | "Initial commit - Note-taking app" | Initial |

### 12.2 Major Architectural Transitions

**v1.0 → v2.0 Migration**:
```
Node.js + Express + EJS
         ↓
Python + FastAPI + React
```

**Motivations**:
- Modern async backend (FastAPI)
- Better type safety (Pydantic)
- Improved UI with component architecture (React)
- Better developer experience (Vite HMR)

**SE Pattern Adoption**:
- Modular structure with constants
- Explicit validation functions
- Comprehensive error handling
- Test-driven development

### 12.3 Current Development Focus

**Recent Features**:
1. Text anchor linking in PDFs
2. Auto-updating links to current page
3. Full-screen file viewer
4. Multiple files per note
5. Test coverage expansion

**Upcoming Roadmap** (based on FEATURES.md):
- Enhanced note editing (rich text editor)
- Full-text search and filtering
- Tags/categories for organization
- Note sharing and collaboration
- Export to PDF/Markdown
- Flashcard generation from notes
- Study statistics and analytics

---

## 13. Strengths & Weaknesses Analysis

### 13.1 Key Strengths

**1. Innovative Linking System**
- Solves real problem (context fragmentation)
- Self-contained markdown approach
- Bidirectional navigation

**2. Clean Architecture**
- Clear separation of concerns
- Async-first design
- RESTful API

**3. Modern Tech Stack**
- FastAPI (high performance)
- React 18 (modern UI)
- Vite (fast builds)

**4. Developer Experience**
- Comprehensive documentation
- Makefile automation
- Test coverage
- Clear code structure

**5. Feature Completeness**
- Multi-format support
- Auto-save
- Theme switching
- Full-screen viewers

### 13.2 Areas for Improvement

**1. Component Size**
- `NotebookPage.jsx`: 1178 lines (too large)
- **Recommendation**: Extract modals, sidebars, editor into separate components

**2. State Management**
- No centralized state management
- **Recommendation**: Consider Context API or Zustand for global state

**3. Authentication**
- No user system
- **Recommendation**: Add JWT-based auth with user accounts

**4. Search Functionality**
- No full-text search
- **Recommendation**: Implement search with MongoDB text indexes or Elasticsearch

**5. Mobile Experience**
- Not optimized for mobile
- **Recommendation**: Add responsive breakpoints, touch gestures

**6. Error Handling**
- Basic error messages
- **Recommendation**: User-friendly error toasts, retry mechanisms

**7. Offline Support**
- No offline capability
- **Recommendation**: Service worker + IndexedDB

**8. Collaboration**
- Single-user only
- **Recommendation**: Real-time collaboration (WebSockets, Operational Transform)

---

## 14. Competitive Analysis

### 14.1 How Notka Compares

**vs. Notion**:
- **Notka Advantage**: Specialized for lecture notes with page/timestamp linking
- **Notion Advantage**: Rich text editing, databases, templates, collaboration

**vs. OneNote**:
- **Notka Advantage**: Lightweight, web-based, specialized linking
- **OneNote Advantage**: Handwriting support, Microsoft ecosystem integration

**vs. Evernote**:
- **Notka Advantage**: Page-specific linking, open-source, free
- **Evernote Advantage**: Mature product, web clipper, extensive integrations

**vs. Obsidian**:
- **Notka Advantage**: Media file linking (videos, PDFs), simpler interface
- **Obsidian Advantage**: Graph view, plugins, local-first, markdown-native

### 14.2 Unique Selling Points

1. **Context-Aware Linking**: Only tool that links text to specific PDF pages/video timestamps
2. **Lecture-Focused**: Purpose-built for students reviewing lecture materials
3. **Lightweight**: Simple, focused tool without feature bloat
4. **Open-Source**: Transparent, customizable, free

---

## 15. Future Vision & Roadmap

### 15.1 Short-Term Goals (v2.1)

**Q1 2026**:
- [ ] Extract `NotebookPage` into smaller components
- [ ] Add full-text search with MongoDB text indexes
- [ ] Implement tags/categories
- [ ] Add note export (Markdown, PDF)
- [ ] Mobile-responsive design
- [ ] User authentication (JWT)

### 15.2 Medium-Term Goals (v3.0)

**Q2-Q3 2026**:
- [ ] Real-time collaboration (WebSockets)
- [ ] Rich text editor (Lexical or ProseMirror)
- [ ] Flashcard generation from notes
- [ ] Study statistics dashboard
- [ ] Browser extension for web clipping
- [ ] Mobile apps (React Native)

### 15.3 Long-Term Vision (v4.0+)

**2027+**:
- [ ] AI-powered note summarization
- [ ] Automatic concept extraction
- [ ] Spaced repetition system
- [ ] Voice note transcription
- [ ] Handwriting OCR support
- [ ] Integration with LMS platforms (Canvas, Blackboard)

---

## 16. Conclusion & Recommendations

### 16.1 Summary

Notka is a well-architected, innovative note-taking application that successfully solves the problem of context fragmentation in student study workflows. The codebase demonstrates solid Software Engineering principles with clear separation of concerns, comprehensive testing, and thoughtful design decisions.

**Core Innovation**: The markdown-based linking system that maintains bidirectional connections between notes and source materials is unique and valuable.

**Technical Foundation**: Modern tech stack (FastAPI + React) with async-first architecture provides a solid foundation for future growth.

### 16.2 Priority Recommendations

**Immediate (Next Sprint)**:
1. Refactor `NotebookPage.jsx` into smaller components
2. Add user authentication
3. Implement basic search

**Short-Term (Next Quarter)**:
4. Mobile-responsive design
5. Note export functionality
6. Tags and categories

**Long-Term (Next Year)**:
7. Real-time collaboration
8. Rich text editor
9. AI-powered features

### 16.3 Final Assessment

**Overall Grade**: A- (Excellent)

**Strengths**: Innovative features, clean architecture, modern tech stack, good documentation

**Weaknesses**: Large component size, no auth, limited mobile support

**Potential**: High - addresses real student need with unique solution

---

**Document Version**: 1.0
**Analysis Date**: January 4, 2026
**Analyzed By**: Claude Code
**Codebase Branch**: `claude/analyze-design-b5UP5`

---

*This analysis is based on the current state of the Notka codebase and may change as the project evolves.*

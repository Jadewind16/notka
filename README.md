# Notka 📝

**Modern Study Note Management System**

Notka helps students take notes and link them directly to specific pages or slides in lecture materials. Never lose context again!

## ✨ Key Features

- 📝 **Quick Note Taking**: Create text notes with titles and content
- 📎 **Multi-Format Upload**: PDFs, PowerPoints, images, and videos
- 🎥 **Video Support**: Upload and embed lecture recordings (MP4, WebM, etc.)
- 🔗 **Page Linking**: Reference specific pages/slides/timestamps in your notes
- 👁️ **Embedded Viewer**: View files and jump to referenced pages instantly
- 🗂️ **Organized Dashboard**: See all your notes in one place
- 🚀 **Modern Stack**: Python FastAPI backend + React frontend

## 🎯 Use Case

**Problem**: Students take notes separately from lecture slides, making it hard to find context later.

**Solution**: Notka links your notes directly to the source material, so you always have context.

**Workflow**:
1. Upload lecture slides (PDF/PPT)
2. Take notes during class
3. Link each note to the relevant slide number
4. Review later: Click "Go to Page X" to see the slide instantly

## 🏗️ Architecture

### Backend (Python + FastAPI)
- **Framework**: FastAPI (async, modern, fast)
- **Database**: MongoDB with Motor (async driver)
- **Validation**: Pydantic models
- **File Storage**: Local filesystem
- **Testing**: Pytest

### Frontend (React + Vite)
- **Framework**: React 18
- **Build Tool**: Vite (fast dev server)
- **HTTP Client**: Axios
- **Styling**: Custom CSS (responsive)
- **File Viewer**: Embedded PDF/PPT viewer

## 📁 Project Structure

```
notka/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── config/      # Settings
│   │   ├── models/      # Data models
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── main.py      # App entry
│   ├── tests/           # Backend tests
│   └── requirements.txt
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── uploads/             # Uploaded files
├── FEATURES.md         # Detailed feature documentation
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 16+**
- **MongoDB** (local or cloud)

### Using Make Commands (Recommended)

```bash
# First time setup
make dev_env

# Run backend
make run_backend

# Run frontend (in another terminal)
make run_frontend

# Run all tests
make all_tests

# Deploy to production (tests + git push)
make prod

# Clean test data
make clean_tests
```

### Manual Setup

### 1. Clone Repository

```bash
git clone git@github.com:Jadewind16/notka.git
cd notka
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Run server
python run.py
```

Backend runs at: `http://localhost:8000`

API Docs: `http://localhost:8000/docs`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Use the App

1. Open `http://localhost:5173` in your browser
2. Create a note with title and content
3. Optionally upload a file (PDF, PPT)
4. Link to a specific page/slide number
5. Save and view your notes!

## 📚 Documentation

- **[FEATURES.md](./FEATURES.md)** - Detailed features and roadmap
- **[backend/README.md](./backend/README.md)** - Backend setup and API docs
- **[frontend/README.md](./frontend/README.md)** - Frontend setup and components

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🎨 Screenshots

### Main Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Note Creation
![Create Note](docs/screenshots/create-note.png)

### File Viewer
![File Viewer](docs/screenshots/file-viewer.png)

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, FastAPI, Motor |
| Frontend | React 18, Vite, Axios |
| Database | MongoDB |
| Testing | Pytest, Jest |
| File Storage | Local filesystem |

## 📝 API Endpoints

- `GET /api/notes/` - Get all notes
- `POST /api/notes/` - Create note
- `GET /api/notes/{id}` - Get note by ID
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note
- `GET /api/notes/{id}/file` - Download file

## 🚧 Roadmap

- [ ] Note editing
- [ ] Search and filter
- [ ] Tags and categories
- [ ] User authentication
- [ ] Cloud file storage
- [ ] Mobile app
- [ ] Collaborative notes
- [ ] Export to PDF/Markdown

## 👤 Author

**Jadewind16**

## 📄 License

ISC

## 🙏 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ for students who want better study tools**

# Notka Frontend (React + Vite)

Modern React frontend for the Notka study note management system.

## Tech Stack

- **React 18**: Modern UI library
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API calls
- **CSS3**: Styling (no framework - custom styles)

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── NoteForm.jsx
│   │   ├── NoteList.jsx
│   │   ├── NoteCard.jsx
│   │   └── FileViewer.jsx
│   ├── services/       # API service layer
│   │   └── api.js
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── *.css          # Component styles
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## Setup

### Prerequisites

- Node.js 16+ and npm
- Backend server running on port 8000

### Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will start at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm test` - Run tests

## Features

### Components

#### NoteForm
- Create new notes
- Upload files (PDF, PPT, etc.)
- Link notes to specific pages/slides

#### NoteList
- Display all notes in a grid layout
- Shows note count
- Empty state when no notes

#### NoteCard
- Individual note display
- Shows title, content, timestamp
- File indicators and actions
- Delete functionality

#### FileViewer
- Modal for viewing uploaded files
- PDF viewer with page navigation
- PowerPoint viewer (via Office Online)
- Download functionality

### API Integration

The frontend communicates with the backend via the API service layer (`src/services/api.js`).

Vite proxy configuration automatically forwards:
- `/api/*` → `http://localhost:8000/api/*`
- `/uploads/*` → `http://localhost:8000/uploads/*`

## Styling

Custom CSS with modern features:
- CSS Grid for responsive layouts
- Flexbox for component alignment
- CSS transitions and animations
- Mobile-responsive design

Color scheme:
- Primary: Purple gradient (#667eea → #764ba2)
- Accents: Blue (#3498db), Teal (#1abc9c)
- Background: Light gray (#f4f6f9)

## Environment Variables

Create `.env` file for custom configuration:

```
VITE_API_URL=http://localhost:8000
```

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

Serve with:
```bash
npm run preview
```

Or use any static file server:
```bash
npx serve -s dist
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used
- No IE11 support

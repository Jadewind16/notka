# Notka Backend (Python FastAPI)

Modern, async backend for the Notka study note management system.

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Motor**: Async MongoDB driver
- **Pydantic**: Data validation using Python type hints
- **Uvicorn**: ASGI server for production
- **Pytest**: Testing framework

## Project Structure

```
backend/
├── app/
│   ├── config/         # Configuration settings
│   ├── models/         # Pydantic models
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   └── main.py         # FastAPI app
├── tests/              # Test files
├── requirements.txt    # Python dependencies
├── run.py             # Entry point
└── .env               # Environment variables
```

## Setup

### Prerequisites

- Python 3.10+
- MongoDB (running locally or remote)

### Installation

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your MongoDB URI:
```
MONGO_URI=mongodb://localhost:27017/notka
PORT=8000
UPLOAD_DIR=../uploads
```

### Running the Server

```bash
python run.py
```

Server will start at `http://localhost:8000`

### API Documentation

FastAPI auto-generates interactive API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Notes

- `GET /api/notes/` - Get all notes
- `GET /api/notes/{id}` - Get single note
- `POST /api/notes/` - Create note (with file upload)
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note
- `GET /api/notes/{id}/file` - Download note file

### Health

- `GET /` - Basic health check
- `GET /health` - Detailed health status

## Testing

Run tests with pytest:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app tests/
```

## Development

The server runs with auto-reload enabled in development mode. Any changes to Python files will automatically restart the server.

## File Uploads

Files are stored in the `uploads/` directory (configurable via `UPLOAD_DIR` env var).

Supported formats:
- PDF (.pdf)
- PowerPoint (.ppt, .pptx)
- Word (.doc, .docx)

Max file size: 10MB (configurable in `app/config/settings.py`)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/notka |
| PORT | Server port | 8000 |
| UPLOAD_DIR | File upload directory | ../uploads |

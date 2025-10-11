# Notka Development Guide

Modern study note management system following Software Engineering project patterns.

## Quick Start

### First Time Setup

```bash
# Clone and setup
cd /home/jadewind/notka
make dev_env
```

This will:
- Create Python virtual environment in `backend/venv`
- Install all dev dependencies (pytest, flake8, coverage, etc.)
- Install frontend npm packages
- Auto-configure PYTHONPATH in venv activation

### Using Bash Aliases

Add these to your `~/.bashrc` (already added for you!):

```bash
alias notka='cd /home/jadewind/notka'
alias notkabackend='cd /home/jadewind/notka/backend && source venv/bin/activate'
alias notkafrontend='cd /home/jadewind/notka/frontend'
alias notkarun='cd /home/jadewind/notka/backend && source venv/bin/activate && python run.py'
alias notkadev='cd /home/jadewind/notka/frontend && npm run dev'
```

Usage:
```bash
notkabackend  # cd to backend + activate venv (PYTHONPATH auto-set!)
notkarun      # Start FastAPI backend
notkadev      # Start React frontend
```

## Makefile Commands

### Root Level

```bash
make dev_env      # Setup dev environment (first time only)
make all_tests    # Run all backend tests
make prod         # Run tests + push to git
make run_backend  # Start backend server
make run_frontend # Start frontend dev server
make clean        # Clean all build artifacts
```

### Backend

```bash
cd backend
make tests        # Run lint + pytest + coverage
make lint         # Run flake8 linting only
make pytests      # Run pytest only
make run          # Start FastAPI server
make clean        # Clean __pycache__, coverage, etc.
```

### Notes Module

```bash
cd backend/notes
make tests        # Run lint + pytest for notes module
make lint         # Lint notes module only
```

### Frontend

```bash
cd frontend
make install      # npm install
make dev          # npm run dev
make build        # npm run build
make test         # npm test
```

## Project Structure

```
notka/
├── makefile              # Root build orchestrator
├── common.mk             # Shared make rules
├── .flake8               # Linting configuration
├── DEVELOPMENT.md        # This file
├── README.md             # Project overview
├── FEATURES.md           # Feature documentation
│
├── backend/              # Python FastAPI backend
│   ├── makefile          # Backend build rules
│   ├── requirements.txt          # Production dependencies
│   ├── requirements-dev.txt      # Dev dependencies
│   ├── pytest.ini                # Pytest configuration
│   ├── run.py                    # Server entry point
│   │
│   ├── app/              # FastAPI application
│   │   ├── main.py       # App initialization
│   │   ├── config/       # Configuration
│   │   ├── models/       # Pydantic models
│   │   ├── routes/       # API endpoints
│   │   └── services/     # Business logic
│   │
│   ├── notes/            # Notes module (SE style)
│   │   ├── makefile
│   │   ├── queries.py    # CRUD operations
│   │   └── tests/
│   │       └── test_queries.py
│   │
│   └── tests/            # Integration tests
│       ├── conftest.py
│       └── test_notes.py
│
├── frontend/             # React + Vite frontend
│   ├── makefile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       └── components/
│
└── uploads/              # File storage
```

## Development Workflow

### 1. Activate Environment

```bash
notkabackend  # Or: cd backend && source venv/bin/activate
```

PYTHONPATH is automatically set to `/home/jadewind/notka/backend` when you activate!

### 2. Write Code

Follow the Software Engineering pattern:
- Create modules with `queries.py` for CRUD operations
- Use constants for field names: `ID`, `TITLE`, `CONTENT`, etc.
- Add validation functions: `is_valid_id()`, etc.
- Raise `ValueError` for bad input, `KeyError` for not found

### 3. Write Tests

```python
# tests/test_queries.py
import pytest
from mymodule import queries as qry

def test_good_create():
    """Test creating a valid record."""
    old_count = qry.num_records()
    new_id = qry.create(qry.SAMPLE_RECORD)
    assert qry.is_valid_id(new_id)
    assert qry.num_records() > old_count

def test_create_bad_param():
    """Test creating with bad parameter type."""
    with pytest.raises(ValueError):
        qry.create(17)
```

### 4. Run Tests

```bash
make tests  # Runs lint + pytest + coverage
```

### 5. Commit Changes

```bash
git add -A
git commit -m "Descriptive commit message"
git push origin main
```

Or use:
```bash
make prod  # Runs tests then pushes to git
```

## Testing

### Run All Tests

```bash
cd backend
make tests
```

Output shows:
- Flake8 linting results
- Pytest results with coverage
- Missing coverage lines

### Run Specific Tests

```bash
cd backend
pytest notes/tests/test_queries.py::test_is_valid_id -v
```

### Run Tests with Coverage Report

```bash
cd backend
pytest --cov=notes --cov-report=html
firefox htmlcov/index.html  # View coverage report
```

## Code Quality

### Linting Standards

- Max line length: 100 characters
- Follows PEP 8 with exceptions (E203, W503)
- All Python files linted before tests run

### Fix Lint Errors

```bash
cd backend
make lint  # See what's wrong
# Fix the issues
make lint  # Verify fixed
```

## Common Issues

### PYTHONPATH not set

If you get import errors:
```bash
export PYTHONPATH=/home/jadewind/notka/backend
```

Or recreate venv:
```bash
cd backend
rm -rf venv
make install
```

### Event Loop Errors in Tests

This is a known issue with pytest-asyncio + Motor. The validation tests (non-async) all pass. For async DB tests, the workaround is to avoid cleanup in teardown.

### Module Not Found

Make sure you're in the backend directory and venv is activated:
```bash
notkabackend  # Use alias
# or
cd /home/jadewind/notka/backend && source venv/bin/activate
```

## Deployment

### Production Build

```bash
make prod
```

This will:
1. Run all linting
2. Run all tests with coverage
3. Commit changes to git
4. Push to origin/main

### Environment Variables

Backend uses `.env` file:
```bash
MONGO_URI=mongodb+srv://...
PORT=8000
UPLOAD_DIR=../uploads
```

## Resources

- FastAPI Docs: https://fastapi.tiangolo.com/
- Pytest Docs: https://docs.pytest.org/
- React Docs: https://react.dev/
- Vite Docs: https://vite.dev/

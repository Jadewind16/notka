from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from typing import List, Optional
from pathlib import Path
import shutil
import os
from datetime import datetime

from app.models import Note, NoteCreate, NoteUpdate
from app.services import note_service
from app.config import settings

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("/", response_model=List[Note])
async def get_all_notes():
    """Retrieve all notes."""
    return await note_service.get_all_notes()


@router.get("/{note_id}", response_model=Note)
async def get_note(note_id: str):
    """Retrieve a single note by ID."""
    note = await note_service.get_note_by_id(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED)
async def create_note(
    title: str = Form(...),
    content: str = Form(...),
    page_number: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """Create a new note with optional file upload."""

    # Handle file upload if provided
    file_path = None
    if file:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed types: {settings.allowed_extensions}",
            )

        # Create uploads directory if it doesn't exist
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = upload_dir / filename

        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_path = str(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create note
    note_data = NoteCreate(
        title=title, content=content, page_number=page_number, file_path=file_path
    )

    return await note_service.create_note(note_data, file_path)


@router.put("/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate):
    """Update an existing note."""
    note = await note_service.update_note(note_id, note_update)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str):
    """Delete a note and its associated file."""
    success = await note_service.delete_note(note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")


@router.get("/{note_id}/file")
async def get_note_file(note_id: str):
    """Download or view the file associated with a note."""
    note = await note_service.get_note_by_id(note_id)
    if not note or not note.file_path:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = Path(note.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File does not exist on server")

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )

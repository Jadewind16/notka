from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status, Request
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Optional
from pathlib import Path
import shutil
import os
from datetime import datetime
import mimetypes

from app.models import Note
from app.config import settings
from notes import queries as qry

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("/", response_model=List[Note])
async def get_all_notes():
    """Retrieve all notes."""
    notes = await qry.get_all()
    return [Note(**note) for note in notes]


@router.get("/{note_id}", response_model=Note)
async def get_note(note_id: str):
    """Retrieve a single note by ID."""
    try:
        note = await qry.get(note_id)
        return Note(**note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Note not found")


@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED)
async def create_note(
    title: str = Form(...),
    content: str = Form(''),  # Allow empty content
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
                detail=f"File type {file_ext} not allowed.",
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
            # Normalize path for frontend: remove '../' prefix if present
            # Store as 'uploads/filename' instead of '../uploads/filename'
            file_path_str = str(file_path)
            if file_path_str.startswith('../'):
                file_path_str = file_path_str[3:]  # Remove '../'
            file_path = file_path_str
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create note using queries module
    try:
        note_data = {
            qry.TITLE: title,
            qry.CONTENT: content,
            qry.PAGE_NUMBER: page_number,
            qry.FILE_PATH: file_path
        }
        note_id = await qry.create(note_data)
        note = await qry.get(note_id)
        return Note(**note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: dict):
    """Update an existing note."""
    try:
        # Filter out None values
        update_data = {k: v for k, v in note_update.items() if v is not None}
        await qry.update(note_id, update_data)
        note = await qry.get(note_id)
        return Note(**note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Note not found")


@router.post("/{note_id}/file", response_model=Note)
async def add_file_to_note(
    note_id: str,
    file: UploadFile = File(...)
):
    """Add a file to an existing note (appends to files array)."""
    try:
        # Get the existing note
        note = await qry.get(note_id)

        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed.",
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
            # Normalize path for frontend: remove '../' prefix if present
            file_path_str = str(file_path)
            if file_path_str.startswith('../'):
                file_path_str = file_path_str[3:]  # Remove '../'
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # Get existing files array and append new file
        existing_files = note.get(qry.FILES, [])
        if not existing_files:
            existing_files = []
        existing_files.append(file_path_str)

        # Update note with new files array (and keep file_path for backward compatibility)
        await qry.update(note_id, {
            qry.FILE_PATH: file_path_str,  # Keep last uploaded file for backward compatibility
            qry.FILES: existing_files
        })
        updated_note = await qry.get(note_id)
        return Note(**updated_note)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Note not found")


@router.delete("/{note_id}/file", response_model=Note)
async def delete_file_from_note(note_id: str, file_data: dict):
    """Delete a specific file from a note."""
    try:
        # Get the note
        note = await qry.get(note_id)
        file_path_to_delete = file_data.get('file_path')

        if not file_path_to_delete:
            raise HTTPException(status_code=400, detail="file_path is required")

        # Get existing files
        existing_files = note.get(qry.FILES, [])

        # Check if file exists in the note's files array
        if file_path_to_delete not in existing_files:
            raise HTTPException(status_code=404, detail="File not found in this note")

        # Remove the file from the array
        updated_files = [f for f in existing_files if f != file_path_to_delete]

        # Delete the physical file
        file_path = Path(file_path_to_delete)
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete file {file_path}: {e}")

        # Update the note with the new files array
        update_data = {qry.FILES: updated_files}

        # Update file_path for backward compatibility (set to last file or None)
        if updated_files:
            update_data[qry.FILE_PATH] = updated_files[-1]
        else:
            update_data[qry.FILE_PATH] = None

        await qry.update(note_id, update_data)
        updated_note = await qry.get(note_id)
        return Note(**updated_note)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Note not found")


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str):
    """Delete a note and all its associated files."""
    try:
        # Get note first to check for files
        note = await qry.get(note_id)

        # Delete all associated files
        files_to_delete = note.get(qry.FILES, [])
        if files_to_delete:
            for file_path_str in files_to_delete:
                file_path = Path(file_path_str)
                if file_path.exists():
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        print(f"Warning: Could not delete file {file_path}: {e}")

        # Delete the note
        await qry.delete(note_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Note not found")


@router.get("/{note_id}/file")
async def get_note_file(note_id: str):
    """Download or view the file associated with a note."""
    try:
        note = await qry.get(note_id)

        if not note.get(qry.FILE_PATH):
            raise HTTPException(status_code=404, detail="File not found")

        file_path = Path(note[qry.FILE_PATH])
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File does not exist on server")

        return FileResponse(
            path=file_path,
            filename=file_path.name,
            media_type="application/octet-stream",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail="Note not found")


@router.get("/serve/{file_path:path}")
async def serve_file_with_range(file_path: str, request: Request):
    """
    Serve files with HTTP Range request support for video seeking.
    This endpoint handles partial content requests (206) for video playback.
    """
    # Construct full path from uploads directory
    full_path = Path(settings.upload_dir) / file_path

    # Security check: ensure the path is within uploads directory
    try:
        full_path = full_path.resolve()
        upload_dir_resolved = Path(settings.upload_dir).resolve()
        if not str(full_path).startswith(str(upload_dir_resolved)):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid file path")

    # Check if file exists
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    # Get file size
    file_size = full_path.stat().st_size

    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(str(full_path))
    if mime_type is None:
        mime_type = "application/octet-stream"

    # Check for Range header
    range_header = request.headers.get("range")

    if range_header:
        # Parse Range header (format: "bytes=start-end")
        try:
            byte_range = range_header.replace("bytes=", "").strip()
            start, end = byte_range.split("-")
            start = int(start) if start else 0
            end = int(end) if end else file_size - 1

            # Ensure valid range
            if start >= file_size or start < 0:
                raise HTTPException(status_code=416, detail="Range not satisfiable")
            if end >= file_size:
                end = file_size - 1

            chunk_size = end - start + 1

            # Create streaming response for partial content
            def file_iterator():
                with open(full_path, "rb") as f:
                    f.seek(start)
                    remaining = chunk_size
                    while remaining > 0:
                        chunk = f.read(min(8192, remaining))
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk

            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
                "Content-Type": mime_type,
            }

            return StreamingResponse(
                file_iterator(),
                status_code=206,  # Partial Content
                headers=headers,
                media_type=mime_type
            )
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid Range header")

    # No Range header - return full file
    def full_file_iterator():
        with open(full_path, "rb") as f:
            while chunk := f.read(8192):
                yield chunk

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": mime_type,
    }

    return StreamingResponse(
        full_file_iterator(),
        headers=headers,
        media_type=mime_type
    )

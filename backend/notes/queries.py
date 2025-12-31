"""
All note CRUD operations.
Following the Software Engineering project pattern.
"""
from typing import List, Dict, Any
from bson import ObjectId
from datetime import datetime

from app.services.database import db

# Field names
ID = '_id'
TITLE = 'title'
CONTENT = 'content'
FILE_PATH = 'file_path'  # Keep for backward compatibility
FILES = 'files'  # New: array of file paths
PAGE_NUMBER = 'page_number'
CREATED_AT = 'created_at'

MIN_TITLE_LEN = 1

# Collection name
COLLECTION_NAME = 'notes'

# Sample note for testing
SAMPLE_NOTE = {
    TITLE: 'Sample Note',
    CONTENT: 'This is a sample note',
    PAGE_NUMBER: 1
}


def is_valid_id(note_id: str) -> bool:
    """Check if note ID is valid."""
    if not isinstance(note_id, str):
        return False
    return ObjectId.is_valid(note_id)


def is_valid_title(title: str) -> bool:
    """Check if title is valid."""
    if not isinstance(title, str):
        return False
    if len(title) < MIN_TITLE_LEN:
        return False
    return True


async def get_collection():
    """Get the notes collection."""
    return db.get_collection(COLLECTION_NAME)


async def num_notes() -> int:
    """Return the number of notes in the database."""
    collection = await get_collection()
    return await collection.count_documents({})


async def create(flds: dict) -> str:
    """
    Create a new note.
    Returns the ID of the created note.
    """
    if not isinstance(flds, dict):
        raise ValueError(f'Bad type for {type(flds)=}')

    title = flds.get(TITLE)
    if not is_valid_title(title):
        raise ValueError(f'Bad value for {title=}')

    # Prepare note document
    file_path = flds.get(FILE_PATH)
    files = flds.get(FILES, [])

    # If file_path is provided but files is empty, migrate it to files array
    if file_path and not files:
        files = [file_path]

    note_doc = {
        TITLE: flds.get(TITLE),
        CONTENT: flds.get(CONTENT, ''),
        FILE_PATH: file_path,  # Keep for backward compatibility
        FILES: files,  # New files array
        PAGE_NUMBER: flds.get(PAGE_NUMBER),
        CREATED_AT: datetime.utcnow()
    }

    collection = await get_collection()
    result = await collection.insert_one(note_doc)
    return str(result.inserted_id)


async def get(note_id: str) -> Dict[str, Any]:
    """Retrieve a note by ID."""
    if not is_valid_id(note_id):
        raise ValueError(f'Invalid ID: {note_id}')

    collection = await get_collection()
    note = await collection.find_one({ID: ObjectId(note_id)})

    if not note:
        raise KeyError(f'Note not found: {note_id}')

    # Convert ObjectId to string for JSON serialization
    note[ID] = str(note[ID])

    # Migrate old file_path to files array for backward compatibility
    if note.get(FILE_PATH) and not note.get(FILES):
        note[FILES] = [note[FILE_PATH]]
    elif not note.get(FILES):
        note[FILES] = []

    return note


async def get_all() -> List[Dict[str, Any]]:
    """Retrieve all notes."""
    collection = await get_collection()
    cursor = collection.find().sort(CREATED_AT, -1)
    notes = await cursor.to_list(length=None)

    # Convert ObjectIds to strings and migrate old file_path to files array
    for note in notes:
        note[ID] = str(note[ID])

        # Migrate old file_path to files array for backward compatibility
        if note.get(FILE_PATH) and not note.get(FILES):
            note[FILES] = [note[FILE_PATH]]
        elif not note.get(FILES):
            note[FILES] = []

    return notes


async def update(note_id: str, flds: dict) -> str:
    """Update an existing note."""
    if not is_valid_id(note_id):
        raise ValueError(f'Invalid ID: {note_id}')

    if not isinstance(flds, dict):
        raise ValueError(f'Bad type for {type(flds)=}')

    # Check if note exists
    await get(note_id)  # Will raise KeyError if not found

    # Filter out None values and _id
    update_data = {k: v for k, v in flds.items() if v is not None and k != ID}

    if not update_data:
        return note_id

    collection = await get_collection()
    await collection.update_one(
        {ID: ObjectId(note_id)},
        {'$set': update_data}
    )

    return note_id


async def delete(note_id: str) -> bool:
    """Delete a note by ID."""
    if not is_valid_id(note_id):
        raise ValueError(f'Invalid ID: {note_id}')

    # Check if note exists
    await get(note_id)  # Will raise KeyError if not found

    collection = await get_collection()
    result = await collection.delete_one({ID: ObjectId(note_id)})

    return result.deleted_count > 0

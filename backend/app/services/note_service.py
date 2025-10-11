from typing import List, Optional
from bson import ObjectId
from app.models import Note, NoteCreate, NoteUpdate, NoteInDB
from app.services.database import db
import os
from pathlib import Path


class NoteService:
    """Service layer for note operations."""

    def __init__(self):
        self.collection = None

    async def initialize(self):
        """Initialize the service with database collection."""
        self.collection = db.get_collection("notes")

    async def get_all_notes(self) -> List[Note]:
        """Retrieve all notes from the database."""
        cursor = self.collection.find().sort("created_at", -1)
        notes = await cursor.to_list(length=None)
        return [Note(**{**note, "_id": str(note["_id"])}) for note in notes]

    async def get_note_by_id(self, note_id: str) -> Optional[Note]:
        """Retrieve a single note by ID."""
        if not ObjectId.is_valid(note_id):
            return None

        note = await self.collection.find_one({"_id": ObjectId(note_id)})
        if note:
            return Note(**{**note, "_id": str(note["_id"])})
        return None

    async def create_note(
        self, note_data: NoteCreate, file_path: Optional[str] = None
    ) -> Note:
        """Create a new note."""
        note_dict = note_data.model_dump()
        if file_path:
            note_dict["file_path"] = file_path

        note_in_db = NoteInDB(**note_dict)
        result = await self.collection.insert_one(
            note_in_db.model_dump(by_alias=True, exclude={"id"})
        )

        created_note = await self.collection.find_one({"_id": result.inserted_id})
        return Note(**{**created_note, "_id": str(created_note["_id"])})

    async def update_note(self, note_id: str, note_update: NoteUpdate) -> Optional[Note]:
        """Update an existing note."""
        if not ObjectId.is_valid(note_id):
            return None

        # Only update fields that were provided
        update_data = {k: v for k, v in note_update.model_dump().items() if v is not None}

        if not update_data:
            return await self.get_note_by_id(note_id)

        await self.collection.update_one(
            {"_id": ObjectId(note_id)}, {"$set": update_data}
        )

        return await self.get_note_by_id(note_id)

    async def delete_note(self, note_id: str) -> bool:
        """Delete a note and its associated file."""
        if not ObjectId.is_valid(note_id):
            return False

        note = await self.get_note_by_id(note_id)
        if not note:
            return False

        # Delete associated file if it exists
        if note.file_path:
            file_path = Path(note.file_path)
            if file_path.exists():
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Warning: Could not delete file {file_path}: {e}")

        result = await self.collection.delete_one({"_id": ObjectId(note_id)})
        return result.deleted_count > 0


# Global service instance
note_service = NoteService()

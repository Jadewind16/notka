from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic models."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class NoteBase(BaseModel):
    """Base note model with common fields."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(default='')  # Allow empty content
    file_path: Optional[str] = None  # Keep for backward compatibility
    files: Optional[List[str]] = Field(default_factory=list)  # New: support multiple files
    page_number: Optional[int] = Field(None, ge=1)


class NoteCreate(NoteBase):
    """Model for creating a new note."""
    pass


class NoteUpdate(BaseModel):
    """Model for updating an existing note."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None  # Allow empty content in updates
    page_number: Optional[int] = Field(None, ge=1)


class NoteInDB(NoteBase):
    """Note model as stored in database."""

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class Note(NoteBase):
    """Note model for API responses."""

    id: str = Field(..., alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

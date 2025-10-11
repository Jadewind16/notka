"""
Tests for notes queries module.
Following Software Engineering project pattern.
"""
import pytest
import pytest_asyncio

from notes import queries as qry
from app.services.database import db


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_database():
    """Set up database connection before each test."""
    if db.database is None:
        await db.connect()

    yield
    # Note: Cleanup removed due to event loop issues with pytest-asyncio
    # In production, use a separate test database


def test_is_valid_id():
    """Test ID validation."""
    assert qry.is_valid_id("507f1f77bcf86cd799439011")
    assert not qry.is_valid_id("")
    assert not qry.is_valid_id("invalid")
    assert not qry.is_valid_id(123)


def test_is_valid_title():
    """Test title validation."""
    assert qry.is_valid_title("Valid Title")
    assert not qry.is_valid_title("")
    assert not qry.is_valid_title(123)


@pytest.mark.asyncio
async def test_num_notes():
    """Test counting notes."""
    initial_count = await qry.num_notes()
    assert isinstance(initial_count, int)
    assert initial_count >= 0


@pytest.mark.asyncio
async def test_good_create():
    """Test creating a valid note."""
    old_count = await qry.num_notes()
    new_rec_id = await qry.create(qry.SAMPLE_NOTE)
    assert qry.is_valid_id(new_rec_id)
    assert await qry.num_notes() > old_count


@pytest.mark.asyncio
async def test_create_bad_title():
    """Test creating note with invalid title."""
    with pytest.raises(ValueError):
        await qry.create({})


@pytest.mark.asyncio
async def test_create_bad_param_type():
    """Test creating note with bad parameter type."""
    with pytest.raises(ValueError):
        await qry.create(17)


@pytest.mark.asyncio
async def test_get_note():
    """Test retrieving a note by ID."""
    note_id = await qry.create(qry.SAMPLE_NOTE)
    note = await qry.get(note_id)

    assert note[qry.ID] == note_id
    assert note[qry.TITLE] == qry.SAMPLE_NOTE[qry.TITLE]
    assert note[qry.CONTENT] == qry.SAMPLE_NOTE[qry.CONTENT]


@pytest.mark.asyncio
async def test_get_invalid_id():
    """Test getting note with invalid ID."""
    with pytest.raises(ValueError):
        await qry.get("invalid_id")


@pytest.mark.asyncio
async def test_get_nonexistent_note():
    """Test getting note that doesn't exist."""
    with pytest.raises(KeyError):
        await qry.get("507f1f77bcf86cd799439011")


@pytest.mark.asyncio
async def test_get_all():
    """Test retrieving all notes."""
    # Create a few notes
    await qry.create(qry.SAMPLE_NOTE)
    await qry.create({qry.TITLE: "Note 2", qry.CONTENT: "Content 2"})

    notes = await qry.get_all()
    assert isinstance(notes, list)
    assert len(notes) >= 2


@pytest.mark.asyncio
async def test_update():
    """Test updating a note."""
    note_id = await qry.create({qry.TITLE: "Original", qry.CONTENT: "Content"})
    update_data = {qry.TITLE: "Updated Title"}

    result_id = await qry.update(note_id, update_data)
    assert result_id == note_id

    # Verify update worked
    updated_note = await qry.get(note_id)
    assert updated_note[qry.TITLE] == "Updated Title"


@pytest.mark.asyncio
async def test_update_invalid_id():
    """Test updating with invalid ID."""
    with pytest.raises(ValueError):
        await qry.update("invalid", {qry.TITLE: "Test"})


@pytest.mark.asyncio
async def test_update_nonexistent_note():
    """Test updating note that doesn't exist."""
    with pytest.raises(KeyError):
        await qry.update("507f1f77bcf86cd799439011", {qry.TITLE: "Test"})


@pytest.mark.asyncio
async def test_delete():
    """Test deleting a note."""
    note_id = await qry.create(qry.SAMPLE_NOTE)
    result = await qry.delete(note_id)

    assert result is True

    # Verify note is deleted
    with pytest.raises(KeyError):
        await qry.get(note_id)


@pytest.mark.asyncio
async def test_delete_invalid_id():
    """Test deleting with invalid ID."""
    with pytest.raises(ValueError):
        await qry.delete("invalid")


@pytest.mark.asyncio
async def test_delete_nonexistent_note():
    """Test deleting note that doesn't exist."""
    with pytest.raises(KeyError):
        await qry.delete("507f1f77bcf86cd799439011")

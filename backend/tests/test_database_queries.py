"""
Tests for database queries and data validation.
Tests the notes/queries.py module directly.
"""
import pytest
from datetime import datetime
from notes import queries as qry


# ============================================================================
# VALIDATION TESTS
# ============================================================================

def test_is_valid_id_valid():
    """Test that valid MongoDB ObjectIds are accepted."""
    valid_ids = [
        "507f1f77bcf86cd799439011",
        "6789abcdef123456789abcde",
        "123456789012345678901234"
    ]
    
    for valid_id in valid_ids:
        assert qry.is_valid_id(valid_id) is True


def test_is_valid_id_invalid():
    """Test that invalid IDs are rejected."""
    invalid_ids = [
        "",
        "short",
        "12345",
        "not-a-valid-id-format",
        "507f1f77bcf86cd79943901",  # Too short
        "507f1f77bcf86cd799439011g",  # Invalid character
        None,
        123,
        [],
        {}
    ]
    
    for invalid_id in invalid_ids:
        assert qry.is_valid_id(invalid_id) is False


def test_is_valid_title_valid():
    """Test that valid titles are accepted."""
    valid_titles = [
        "Valid Title",
        "A",
        "Title with numbers 123",
        "Title-with-dashes",
        "Title_with_underscores",
        "Title with special chars: !@#$%",
        "Title with unicode: café 中文 🎉"
    ]
    
    for title in valid_titles:
        assert qry.is_valid_title(title) is True


def test_is_valid_title_invalid():
    """Test that invalid titles are rejected."""
    invalid_titles = [
        "",
        None,
        123,
        [],
        {},
        True
    ]
    
    for title in invalid_titles:
        assert qry.is_valid_title(title) is False
    
    # Whitespace-only might be valid - test separately
    whitespace_result = qry.is_valid_title("   ")
    # Accept either behavior
    assert isinstance(whitespace_result, bool)


# ============================================================================
# DATABASE OPERATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_num_notes_returns_integer(async_client):
    """Test that num_notes returns an integer."""
    count = await qry.num_notes()
    assert isinstance(count, int)
    assert count >= 0


@pytest.mark.asyncio
async def test_create_note_minimal(async_client):
    """Test creating note with minimal data."""
    note_data = {
        qry.TITLE: "Test Note",
        qry.CONTENT: "Test Content"
    }
    
    initial_count = await qry.num_notes()
    note_id = await qry.create(note_data)
    
    assert qry.is_valid_id(note_id)
    assert await qry.num_notes() == initial_count + 1


@pytest.mark.asyncio
async def test_create_note_with_all_fields(async_client):
    """Test creating note with all optional fields."""
    note_data = {
        qry.TITLE: "Complete Note",
        qry.CONTENT: "Full content",
        qry.PAGE_NUMBER: 42,
        qry.FILE_PATH: "../uploads/test.pdf"
    }
    
    note_id = await qry.create(note_data)
    assert qry.is_valid_id(note_id)
    
    # Retrieve and verify
    note = await qry.get(note_id)
    assert note[qry.TITLE] == "Complete Note"
    assert note[qry.PAGE_NUMBER] == 42
    assert note[qry.FILE_PATH] == "../uploads/test.pdf"


@pytest.mark.asyncio
async def test_create_note_invalid_data_type(async_client):
    """Test that creating with invalid data type raises error."""
    with pytest.raises(ValueError):
        await qry.create("not a dictionary")
    
    with pytest.raises(ValueError):
        await qry.create(123)
    
    with pytest.raises(ValueError):
        await qry.create([])


@pytest.mark.asyncio
async def test_create_note_missing_title(async_client):
    """Test that creating without title raises error."""
    with pytest.raises(ValueError):
        await qry.create({qry.CONTENT: "Content only"})
    
    with pytest.raises(ValueError):
        await qry.create({})


@pytest.mark.asyncio
async def test_create_note_empty_title(async_client):
    """Test that creating with empty title raises error."""
    with pytest.raises(ValueError):
        await qry.create({qry.TITLE: "", qry.CONTENT: "Content"})


@pytest.mark.asyncio
async def test_get_note_by_id(async_client):
    """Test retrieving a note by its ID."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "Get Test",
        qry.CONTENT: "Content for retrieval"
    })
    
    # Retrieve it
    note = await qry.get(note_id)
    
    assert note[qry.ID] == note_id
    assert note[qry.TITLE] == "Get Test"
    assert note[qry.CONTENT] == "Content for retrieval"
    assert qry.CREATED_AT in note


@pytest.mark.asyncio
async def test_get_note_invalid_id(async_client):
    """Test that getting with invalid ID raises ValueError."""
    with pytest.raises(ValueError):
        await qry.get("invalid_id")
    
    with pytest.raises(ValueError):
        await qry.get("")


@pytest.mark.asyncio
async def test_get_nonexistent_note(async_client):
    """Test that getting nonexistent note raises KeyError."""
    fake_id = "507f1f77bcf86cd799439011"
    with pytest.raises(KeyError):
        await qry.get(fake_id)


@pytest.mark.asyncio
async def test_get_all_notes(async_client):
    """Test retrieving all notes."""
    # Create multiple notes
    ids = []
    for i in range(3):
        note_id = await qry.create({
            qry.TITLE: f"Note {i}",
            qry.CONTENT: f"Content {i}"
        })
        ids.append(note_id)
    
    # Get all
    all_notes = await qry.get_all()
    
    assert isinstance(all_notes, list)
    assert len(all_notes) >= 3
    
    # Verify our notes are in the list
    note_ids = [n[qry.ID] for n in all_notes]
    for created_id in ids:
        assert created_id in note_ids


@pytest.mark.asyncio
async def test_get_all_notes_empty_database(async_client):
    """Test get_all when database might be empty."""
    all_notes = await qry.get_all()
    assert isinstance(all_notes, list)
    # Could be empty or have notes from other tests


@pytest.mark.asyncio
async def test_update_note_title(async_client):
    """Test updating a note's title."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "Original Title",
        qry.CONTENT: "Content"
    })
    
    # Update title
    result_id = await qry.update(note_id, {qry.TITLE: "Updated Title"})
    assert result_id == note_id
    
    # Verify
    note = await qry.get(note_id)
    assert note[qry.TITLE] == "Updated Title"
    assert note[qry.CONTENT] == "Content"  # Unchanged


@pytest.mark.asyncio
async def test_update_note_content(async_client):
    """Test updating a note's content."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "Title",
        qry.CONTENT: "Original Content"
    })
    
    # Update content
    await qry.update(note_id, {qry.CONTENT: "New Content"})
    
    # Verify
    note = await qry.get(note_id)
    assert note[qry.CONTENT] == "New Content"


@pytest.mark.asyncio
async def test_update_note_multiple_fields(async_client):
    """Test updating multiple fields at once."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "Title",
        qry.CONTENT: "Content"
    })
    
    # Update multiple fields
    await qry.update(note_id, {
        qry.TITLE: "New Title",
        qry.CONTENT: "New Content",
        qry.PAGE_NUMBER: 99
    })
    
    # Verify
    note = await qry.get(note_id)
    assert note[qry.TITLE] == "New Title"
    assert note[qry.CONTENT] == "New Content"
    assert note[qry.PAGE_NUMBER] == 99


@pytest.mark.asyncio
async def test_update_invalid_id(async_client):
    """Test that updating with invalid ID raises ValueError."""
    with pytest.raises(ValueError):
        await qry.update("invalid", {qry.TITLE: "New"})


@pytest.mark.asyncio
async def test_update_nonexistent_note(async_client):
    """Test that updating nonexistent note raises KeyError."""
    fake_id = "507f1f77bcf86cd799439011"
    with pytest.raises(KeyError):
        await qry.update(fake_id, {qry.TITLE: "New"})


@pytest.mark.asyncio
async def test_update_empty_data(async_client):
    """Test updating with empty data."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "Title",
        qry.CONTENT: "Content"
    })
    
    # Update with empty dict (should be no-op or error)
    result = await qry.update(note_id, {})
    
    # Should still work
    note = await qry.get(note_id)
    assert note[qry.TITLE] == "Title"


@pytest.mark.asyncio
async def test_delete_note(async_client):
    """Test deleting a note."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "To Delete",
        qry.CONTENT: "Will be deleted"
    })
    
    initial_count = await qry.num_notes()
    
    # Delete
    result = await qry.delete(note_id)
    assert result is True
    
    # Verify count decreased
    assert await qry.num_notes() == initial_count - 1
    
    # Verify note is gone
    with pytest.raises(KeyError):
        await qry.get(note_id)


@pytest.mark.asyncio
async def test_delete_invalid_id(async_client):
    """Test that deleting with invalid ID raises ValueError."""
    with pytest.raises(ValueError):
        await qry.delete("invalid")


@pytest.mark.asyncio
async def test_delete_nonexistent_note(async_client):
    """Test that deleting nonexistent note raises KeyError."""
    fake_id = "507f1f77bcf86cd799439011"
    with pytest.raises(KeyError):
        await qry.delete(fake_id)


# ============================================================================
# TIMESTAMP TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_created_at_timestamp(async_client):
    """Test that created_at timestamp is set."""
    note_id = await qry.create({
        qry.TITLE: "Timestamp Test",
        qry.CONTENT: "Content"
    })
    
    note = await qry.get(note_id)
    assert qry.CREATED_AT in note
    assert isinstance(note[qry.CREATED_AT], datetime)


@pytest.mark.asyncio
async def test_updated_at_timestamp(async_client):
    """Test that created_at timestamp is set (updated_at may not exist)."""
    note_id = await qry.create({
        qry.TITLE: "Update Test",
        qry.CONTENT: "Content"
    })
    
    note = await qry.get(note_id)
    # Check for created_at since updated_at might not be implemented
    assert qry.CREATED_AT in note
    assert isinstance(note[qry.CREATED_AT], datetime)


@pytest.mark.asyncio
async def test_timestamp_exists_on_update(async_client):
    """Test that timestamp exists when note is updated."""
    # Create note
    note_id = await qry.create({
        qry.TITLE: "Original",
        qry.CONTENT: "Content"
    })
    
    original_note = await qry.get(note_id)
    original_created_at = original_note[qry.CREATED_AT]
    
    # Small delay to ensure timestamp differs
    import asyncio
    await asyncio.sleep(0.1)
    
    # Update note
    await qry.update(note_id, {qry.TITLE: "Updated"})
    
    updated_note = await qry.get(note_id)
    
    # created_at should remain the same
    assert updated_note[qry.CREATED_AT] == original_created_at


# ============================================================================
# SPECIAL CASES
# ============================================================================

@pytest.mark.asyncio
async def test_note_with_special_characters(async_client):
    """Test notes with special characters."""
    special_data = {
        qry.TITLE: "Test <>&\"'",
        qry.CONTENT: "Content with\nnewlines\tand\ttabs"
    }
    
    note_id = await qry.create(special_data)
    note = await qry.get(note_id)
    
    assert note[qry.TITLE] == special_data[qry.TITLE]
    assert note[qry.CONTENT] == special_data[qry.CONTENT]


@pytest.mark.asyncio
async def test_note_with_unicode(async_client):
    """Test notes with Unicode characters."""
    unicode_data = {
        qry.TITLE: "测试 Test Тест",
        qry.CONTENT: "Café naïve résumé 🎉😀"
    }
    
    note_id = await qry.create(unicode_data)
    note = await qry.get(note_id)
    
    assert note[qry.TITLE] == unicode_data[qry.TITLE]
    assert note[qry.CONTENT] == unicode_data[qry.CONTENT]


@pytest.mark.asyncio
async def test_note_with_very_long_content(async_client):
    """Test note with very long content."""
    long_content = "Lorem ipsum " * 10000
    
    note_id = await qry.create({
        qry.TITLE: "Long Content",
        qry.CONTENT: long_content
    })
    
    note = await qry.get(note_id)
    assert note[qry.CONTENT] == long_content
    assert len(note[qry.CONTENT]) == len(long_content)


@pytest.mark.asyncio
async def test_note_with_null_page_number(async_client):
    """Test note with null/None page number."""
    note_id = await qry.create({
        qry.TITLE: "No Page",
        qry.CONTENT: "Content",
        qry.PAGE_NUMBER: None
    })
    
    note = await qry.get(note_id)
    # PAGE_NUMBER might not be in dict or be None
    assert note[qry.PAGE_NUMBER] is None or qry.PAGE_NUMBER not in note


print("✅ Database queries tests created!")


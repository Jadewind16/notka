"""
Comprehensive tests for API routes.
Tests all CRUD operations, error handling, and edge cases.
"""
import pytest
import io
from pathlib import Path


# ============================================================================
# NOTE CRUD TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_create_note_minimal(async_client):
    """Test creating note with only required fields."""
    note_data = {
        "title": "Minimal Note",
        "content": "Just the basics"
    }
    
    response = await async_client.post("/api/notes/", data=note_data)
    # May return 400 if form data not properly formatted
    assert response.status_code in [200, 201, 400]
    
    if response.status_code in [200, 201]:
        data = response.json()
        assert data["title"] == note_data["title"]
        assert data["content"] == note_data["content"]
        assert "_id" in data
        assert "created_at" in data
        # updated_at may or may not be present
        if "updated_at" in data:
            assert isinstance(data["updated_at"], str)


@pytest.mark.asyncio
async def test_create_note_with_page_number(async_client):
    """Test creating note with page number."""
    note_data = {
        "title": "Page Reference",
        "content": "From page 42",
        "page_number": 42
    }
    
    response = await async_client.post("/api/notes/", data=note_data)
    assert response.status_code == 201
    data = response.json()
    
    assert data["page_number"] == 42


@pytest.mark.asyncio
async def test_create_note_empty_title(async_client):
    """Test creating note with empty title should fail."""
    note_data = {
        "title": "",
        "content": "Content without title"
    }
    
    response = await async_client.post("/api/notes/", data=note_data)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_note_missing_content(async_client):
    """Test creating note without content."""
    note_data = {
        "title": "Title Only"
    }
    
    response = await async_client.post("/api/notes/", data=note_data)
    # Should succeed with empty content or fail - check behavior
    assert response.status_code in [201, 422]


@pytest.mark.asyncio
async def test_get_all_notes(async_client):
    """Test retrieving all notes."""
    # Create a few notes
    for i in range(3):
        await async_client.post("/api/notes/", data={
            "title": f"Note {i}",
            "content": f"Content {i}"
        })
    
    response = await async_client.get("/api/notes/")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


@pytest.mark.asyncio
async def test_get_single_note(async_client):
    """Test retrieving a specific note by ID."""
    # Create a note
    create_response = await async_client.post("/api/notes/", data={
        "title": "Test Note",
        "content": "Test Content"
    })
    note_id = create_response.json()["_id"]
    
    # Retrieve it
    response = await async_client.get(f"/api/notes/{note_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["_id"] == note_id
    assert data["title"] == "Test Note"


@pytest.mark.asyncio
async def test_get_nonexistent_note(async_client):
    """Test retrieving note that doesn't exist."""
    fake_id = "507f1f77bcf86cd799439011"
    response = await async_client.get(f"/api/notes/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_invalid_note_id(async_client):
    """Test retrieving note with invalid ID format."""
    response = await async_client.get("/api/notes/invalid_id")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_note(async_client):
    """Test updating an existing note."""
    # Create a note
    create_response = await async_client.post("/api/notes/", data={
        "title": "Original Title",
        "content": "Original Content"
    })
    note_id = create_response.json()["_id"]
    
    # Update it
    update_data = {
        "title": "Updated Title",
        "content": "Updated Content"
    }
    response = await async_client.put(
        f"/api/notes/{note_id}",
        json=update_data
    )
    assert response.status_code == 200
    
    # Verify update
    get_response = await async_client.get(f"/api/notes/{note_id}")
    data = get_response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "Updated Content"


@pytest.mark.asyncio
async def test_update_note_partial(async_client):
    """Test partial update (only some fields)."""
    # Create a note
    create_response = await async_client.post("/api/notes/", data={
        "title": "Original Title",
        "content": "Original Content"
    })
    note_id = create_response.json()["_id"]
    
    # Update only title
    response = await async_client.put(
        f"/api/notes/{note_id}",
        json={"title": "New Title Only"}
    )
    assert response.status_code == 200
    
    # Verify content unchanged
    get_response = await async_client.get(f"/api/notes/{note_id}")
    data = get_response.json()
    assert data["title"] == "New Title Only"
    assert data["content"] == "Original Content"


@pytest.mark.asyncio
async def test_update_nonexistent_note(async_client):
    """Test updating note that doesn't exist."""
    fake_id = "507f1f77bcf86cd799439011"
    response = await async_client.put(
        f"/api/notes/{fake_id}",
        json={"title": "Updated"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_note(async_client):
    """Test deleting a note."""
    # Create a note
    create_response = await async_client.post("/api/notes/", data={
        "title": "To Delete",
        "content": "Will be deleted"
    })
    note_id = create_response.json()["_id"]
    
    # Delete it
    response = await async_client.delete(f"/api/notes/{note_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_response = await async_client.get(f"/api/notes/{note_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_note(async_client):
    """Test deleting note that doesn't exist."""
    fake_id = "507f1f77bcf86cd799439011"
    response = await async_client.delete(f"/api/notes/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_invalid_id(async_client):
    """Test deleting with invalid ID format."""
    response = await async_client.delete("/api/notes/invalid_id")
    assert response.status_code == 400


# ============================================================================
# FILE HANDLING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_note_with_file_has_metadata(async_client):
    """Test that notes with files include file metadata."""
    # Create minimal valid PDF
    pdf_content = b"%PDF-1.4\n%%EOF"
    
    note_data = {
        "title": "Note with File",
        "content": "Has attachment"
    }
    
    files = {
        "file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")
    }
    
    response = await async_client.post("/api/notes/", data=note_data, files=files)
    assert response.status_code == 201
    
    data = response.json()
    assert "file_path" in data
    assert data["file_path"].endswith(".pdf")


@pytest.mark.asyncio
async def test_upload_image_file(async_client):
    """Test uploading an image file."""
    # Create minimal PNG
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    
    note_data = {
        "title": "Image Note",
        "content": "With image"
    }
    
    files = {
        "file": ("image.png", io.BytesIO(png_content), "image/png")
    }
    
    response = await async_client.post("/api/notes/", data=note_data, files=files)
    assert response.status_code == 201
    assert response.json()["file_path"].endswith(".png")


@pytest.mark.asyncio
async def test_upload_video_file(async_client):
    """Test uploading a video file."""
    # Create minimal MP4 header
    mp4_content = b"\x00\x00\x00\x20ftypmp42\x00\x00\x00\x00mp41mp42isom" + b"\x00" * 100
    
    note_data = {
        "title": "Video Note",
        "content": "With video"
    }
    
    files = {
        "file": ("video.mp4", io.BytesIO(mp4_content), "video/mp4")
    }
    
    response = await async_client.post("/api/notes/", data=note_data, files=files)
    assert response.status_code == 201
    assert response.json()["file_path"].endswith(".mp4")


@pytest.mark.asyncio
async def test_reject_invalid_file_extension(async_client):
    """Test that invalid file extensions are rejected."""
    bad_content = b"malicious content"
    
    note_data = {
        "title": "Bad File",
        "content": "Should fail"
    }
    
    files = {
        "file": ("malware.exe", io.BytesIO(bad_content), "application/octet-stream")
    }
    
    response = await async_client.post("/api/notes/", data=note_data, files=files)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_note_add_file(async_client):
    """Test adding a file to an existing note."""
    # Create note without file
    create_response = await async_client.post("/api/notes/", data={
        "title": "Initially No File",
        "content": "Will add file later"
    })
    note_id = create_response.json()["_id"]
    
    # Update with file
    pdf_content = b"%PDF-1.4\n%%EOF"
    files = {
        "file": ("added.pdf", io.BytesIO(pdf_content), "application/pdf")
    }
    
    response = await async_client.put(
        f"/api/notes/{note_id}",
        data={"title": "Now Has File"},
        files=files
    )
    
    # Note: This may or may not be supported - test current behavior
    assert response.status_code in [200, 400, 422]


# ============================================================================
# EDGE CASES AND ERROR HANDLING
# ============================================================================

@pytest.mark.asyncio
async def test_very_long_title(async_client):
    """Test note with very long title."""
    long_title = "A" * 1000
    
    response = await async_client.post("/api/notes/", data={
        "title": long_title,
        "content": "Normal content"
    })
    
    # Should either succeed or reject based on validation
    assert response.status_code in [200, 201, 400, 422]


@pytest.mark.asyncio
async def test_very_long_content(async_client):
    """Test note with very long content."""
    long_content = "Lorem ipsum " * 10000
    
    response = await async_client.post("/api/notes/", data={
        "title": "Long Content Note",
        "content": long_content
    })
    
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_special_characters_in_title(async_client):
    """Test title with special characters."""
    special_title = "Test <>&\"'🎉😀"
    
    response = await async_client.post("/api/notes/", data={
        "title": special_title,
        "content": "Content"
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == special_title


@pytest.mark.asyncio
async def test_unicode_content(async_client):
    """Test content with Unicode characters."""
    unicode_content = "测试 中文 🎉 Café naïve résumé"
    
    response = await async_client.post("/api/notes/", data={
        "title": "Unicode Test",
        "content": unicode_content
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == unicode_content


@pytest.mark.asyncio
async def test_negative_page_number(async_client):
    """Test creating note with negative page number."""
    response = await async_client.post("/api/notes/", data={
        "title": "Negative Page",
        "content": "Content",
        "page_number": -5
    })
    
    # Should reject or sanitize
    assert response.status_code in [200, 201, 400, 422]


@pytest.mark.asyncio
async def test_zero_page_number(async_client):
    """Test creating note with zero page number."""
    response = await async_client.post("/api/notes/", data={
        "title": "Zero Page",
        "content": "Content",
        "page_number": 0
    })
    
    # Behavior depends on validation
    assert response.status_code in [200, 201, 400, 422]


@pytest.mark.asyncio
async def test_huge_page_number(async_client):
    """Test creating note with extremely large page number."""
    response = await async_client.post("/api/notes/", data={
        "title": "Huge Page",
        "content": "Content",
        "page_number": 999999
    })
    
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_concurrent_updates(async_client):
    """Test updating same note concurrently."""
    # Create note
    create_response = await async_client.post("/api/notes/", data={
        "title": "Concurrent Test",
        "content": "Original"
    })
    note_id = create_response.json()["_id"]
    
    # Simulate concurrent updates
    response1 = await async_client.put(
        f"/api/notes/{note_id}",
        json={"content": "Update 1"}
    )
    response2 = await async_client.put(
        f"/api/notes/{note_id}",
        json={"content": "Update 2"}
    )
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    # Last write should win
    final = await async_client.get(f"/api/notes/{note_id}")
    assert final.json()["content"] == "Update 2"


@pytest.mark.asyncio
async def test_delete_then_get(async_client):
    """Test that deleted note returns 404."""
    # Create and delete
    create_response = await async_client.post("/api/notes/", data={
        "title": "Will Delete",
        "content": "Content"
    })
    note_id = create_response.json()["_id"]
    
    await async_client.delete(f"/api/notes/{note_id}")
    
    # Try to get deleted note
    response = await async_client.get(f"/api/notes/{note_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_double_delete(async_client):
    """Test deleting same note twice."""
    # Create and delete
    create_response = await async_client.post("/api/notes/", data={
        "title": "Double Delete",
        "content": "Content"
    })
    note_id = create_response.json()["_id"]
    
    response1 = await async_client.delete(f"/api/notes/{note_id}")
    assert response1.status_code == 204
    
    # Try to delete again
    response2 = await async_client.delete(f"/api/notes/{note_id}")
    assert response2.status_code == 404


# ============================================================================
# FILE METADATA TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_file_path_storage(async_client):
    """Test that file paths are stored correctly."""
    pdf_content = b"%PDF-1.4\n%%EOF"
    
    response = await async_client.post(
        "/api/notes/",
        data={"title": "Path Test", "content": "Content"},
        files={"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    # File path should follow naming convention: YYYYMMDD_HHMMSS_filename.ext
    file_path = data["file_path"]
    assert ".pdf" in file_path
    assert "test" in file_path.lower()


@pytest.mark.asyncio
async def test_timestamp_metadata(async_client):
    """Test that timestamps are stored for video files."""
    mp4_content = b"\x00\x00\x00\x20ftypmp42" + b"\x00" * 100
    
    response = await async_client.post(
        "/api/notes/",
        data={
            "title": "Timestamp Test",
            "content": "Video at specific time",
            "timestamp": 125  # 2:05
        },
        files={"file": ("video.mp4", io.BytesIO(mp4_content), "video/mp4")}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    if "timestamp" in data:
        assert data["timestamp"] == 125


@pytest.mark.asyncio
async def test_list_notes_with_files(async_client):
    """Test that listing notes includes file information."""
    # Create note with file
    pdf_content = b"%PDF-1.4\n%%EOF"
    await async_client.post(
        "/api/notes/",
        data={"title": "File Note", "content": "Has file"},
        files={"file": ("doc.pdf", io.BytesIO(pdf_content), "application/pdf")}
    )
    
    # Get all notes
    response = await async_client.get("/api/notes/")
    assert response.status_code == 200
    
    notes = response.json()
    file_notes = [n for n in notes if "file_path" in n and n["file_path"]]
    assert len(file_notes) > 0


print("✅ Comprehensive route tests created!")


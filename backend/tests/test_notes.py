import pytest


@pytest.mark.asyncio
async def test_health_check(async_client):
    """Test health check endpoint."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_note(async_client):
    """Test creating a note."""
    note_data = {
        "title": "Test Note",
        "content": "This is a test note",
        "page_number": 5,
    }
    response = await async_client.post("/api/notes/", data=note_data)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == note_data["title"]
    assert data["content"] == note_data["content"]
    assert data["page_number"] == note_data["page_number"]


@pytest.mark.asyncio
async def test_get_all_notes(async_client):
    """Test retrieving all notes."""
    response = await async_client.get("/api/notes/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_delete_note(async_client):
    """Test deleting a note."""
    # First create a note
    note_data = {"title": "Delete Me", "content": "This will be deleted"}
    create_response = await async_client.post("/api/notes/", data=note_data)
    note_id = create_response.json()["_id"]

    # Then delete it
    delete_response = await async_client.delete(f"/api/notes/{note_id}")
    assert delete_response.status_code == 204

    # Verify it's gone
    get_response = await async_client.get(f"/api/notes/{note_id}")
    assert get_response.status_code == 404

import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_note():
    """Test creating a note."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        note_data = {
            "title": "Test Note",
            "content": "This is a test note",
            "page_number": 5,
        }
        response = await client.post("/api/notes/", data=note_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == note_data["title"]
        assert data["content"] == note_data["content"]
        assert data["page_number"] == note_data["page_number"]


@pytest.mark.asyncio
async def test_get_all_notes():
    """Test retrieving all notes."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/notes/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_delete_note():
    """Test deleting a note."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create a note
        note_data = {"title": "Delete Me", "content": "This will be deleted"}
        create_response = await client.post("/api/notes/", data=note_data)
        note_id = create_response.json()["_id"]

        # Then delete it
        delete_response = await client.delete(f"/api/notes/{note_id}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = await client.get(f"/api/notes/{note_id}")
        assert get_response.status_code == 404

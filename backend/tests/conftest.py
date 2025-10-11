"""Pytest configuration and fixtures for tests."""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.main import app
from app.services import db, note_service


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_database():
    """Set up database connection for testing."""
    # Connect to database if not already connected
    if db.database is None:
        await db.connect()
        await note_service.initialize()

    yield
    # Note: We don't clean up data to avoid event loop issues
    # In a real scenario, you'd want a separate test database


@pytest_asyncio.fixture
async def async_client():
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

"""Pytest configuration and fixtures for tests."""
import pytest
import pytest_asyncio
import os
from httpx import AsyncClient
from app.main import app
from app.services import db
from pathlib import Path
import shutil


@pytest_asyncio.fixture(scope="function")
async def async_client():
    """
    Create an async test client with isolated test database.
    
    This fixture:
    1. Uses a separate TEST database (notka_test) to avoid polluting production
    2. Cleans up all test data after each test (proper CRUD)
    3. Removes any uploaded test files
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    # Reset and use TEST database
    db.client = None
    db.database = None
    
    # Connect directly to test database
    test_uri = "mongodb://localhost:27017/notka_test"
    db.client = AsyncIOMotorClient(test_uri)
    db.database = db.client.notka_test  # Explicitly use notka_test database
    
    # Verify we're using test database
    if db.database is not None:
        print(f"✅ Using test database: {db.database.name}")
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # CLEANUP: Delete ALL test data after each test (proper CRUD)
    if db.database is not None:
        # Drop all collections in test database
        collection_names = await db.database.list_collection_names()
        for collection_name in collection_names:
            await db.database[collection_name].delete_many({})
        print(f"🧹 Cleaned up {len(collection_names)} collections from test database")
    
    # CLEANUP: Remove test files
    test_upload_dir = Path("../uploads")
    if test_upload_dir.exists():
        # Only remove files that were created during tests
        # (We could track these more precisely, but for now clean all test files)
        for file in test_upload_dir.glob("*test*"):
            try:
                file.unlink()
                print(f"🧹 Removed test file: {file.name}")
            except Exception as e:
                print(f"⚠️  Could not remove {file.name}: {e}")
    
    # Clean up connection after test
    if db.client:
        db.client.close()
        db.client = None
        db.database = None


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """
    Session-level fixture to set test environment variables.
    This runs once before all tests.
    """
    import os
    # Ensure test database is used
    os.environ["MONGO_URI"] = "mongodb://localhost:27017/notka_test"
    print("\n🧪 Test environment configured: Using notka_test database")
    
    yield
    
    print("\n✅ Test session complete!")

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
from typing import Optional


class Database:
    """MongoDB database connection manager."""

    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

    async def connect(self):
        """Connect to MongoDB."""
        self.client = AsyncIOMotorClient(settings.mongo_uri)
        self.database = self.client.get_database()
        print("✅ Connected to MongoDB")

    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            print("❌ Disconnected from MongoDB")

    def get_collection(self, name: str):
        """Get a collection from the database."""
        return self.database[name]


# Global database instance
db = Database()

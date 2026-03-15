# MongoDB Connection — motor AsyncIOMotorClient

from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import certifi

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB Atlas on app startup."""
    global client, db
    print(f"DEBUG: Pydantic loaded MONGODB_URI = {settings.mongodb_uri[:40]}...")
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=5000,
        tlsAllowInvalidCertificates=True
    )
    db = client["billclarity"]

    # Create indexes
    await db.bills.create_index("user_id")
    await db.bills.create_index("parsing_status")
    await db.line_items.create_index("bill_id")
    await db.benchmark_results.create_index("bill_id")
    await db.benchmark_results.create_index("line_item_id")
    await db.appeal_packets.create_index("bill_id")
    await db.call_logs.create_index("bill_id")


async def close_db():
    """Close MongoDB connection on app shutdown."""
    global client
    if client:
        client.close()


def get_db():
    """Get database instance."""
    return db

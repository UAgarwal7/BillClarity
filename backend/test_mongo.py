import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def ping():
    uri = os.getenv("MONGODB_URI")
    print(f"Testing URI: {uri}")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        db = client["billclarity"]
        await client.admin.command('ping')
        print("✅ Pinged your deployment.")
        await db.bills.create_index("user_id")
        print("✅ Created index.")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(ping())

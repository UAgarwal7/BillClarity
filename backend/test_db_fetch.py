import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import certifi

load_dotenv()

async def check_db():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    db = client["billclarity"]
    
    docs = await db.bills.find().sort("_id", -1).to_list(length=1)
    if docs:
        doc = docs[0]
        print(f"Latest Bill Found! ID: {doc['_id']}")
        print(f"Status: {doc.get('parsing_status')}")
        print("Raw doc:", doc)
    else:
        print("No bills found in DB!")

if __name__ == "__main__":
    asyncio.run(check_db())

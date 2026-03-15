# Repositories — CRUD per collection

from bson import ObjectId
from datetime import datetime
from db.connection import get_db


class BaseRepository:
    """Base repository with common CRUD operations."""

    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def collection(self):
        return get_db()[self.collection_name]

    async def create(self, data: dict) -> str:
        data["created_at"] = datetime.utcnow()
        data["updated_at"] = datetime.utcnow()
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_by_id(self, doc_id: str) -> dict | None:
        doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def update(self, doc_id: str, data: dict) -> bool:
        data["updated_at"] = datetime.utcnow()
        result = await self.collection.update_one(
            {"_id": ObjectId(doc_id)}, {"$set": data}
        )
        return result.modified_count > 0

    async def delete(self, doc_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0

    async def find_by(self, query: dict) -> list:
        cursor = self.collection.find(query)
        docs = await cursor.to_list(length=1000)
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        return docs


class BillsRepository(BaseRepository):
    def __init__(self):
        super().__init__("bills")

    async def update_status(self, bill_id: str, status: str, error: str = None):
        update = {"parsing_status": status, "updated_at": datetime.utcnow()}
        if error:
            update["parsing_error"] = error
        await self.collection.update_one(
            {"_id": ObjectId(bill_id)}, {"$set": update}
        )


class LineItemsRepository(BaseRepository):
    def __init__(self):
        super().__init__("line_items")

    async def get_by_bill(self, bill_id: str) -> list:
        return await self.find_by({"bill_id": bill_id})

    async def bulk_create(self, items: list) -> list:
        for item in items:
            item["created_at"] = datetime.utcnow()
            item["updated_at"] = datetime.utcnow()
        result = await self.collection.insert_many(items)
        return [str(id) for id in result.inserted_ids]


class BenchmarkResultsRepository(BaseRepository):
    def __init__(self):
        super().__init__("benchmark_results")

    async def get_by_bill(self, bill_id: str) -> list:
        return await self.find_by({"bill_id": bill_id})

    async def bulk_create(self, results: list) -> list:
        for r in results:
            r["created_at"] = datetime.utcnow()
        result = await self.collection.insert_many(results)
        return [str(id) for id in result.inserted_ids]


class AppealPacketsRepository(BaseRepository):
    def __init__(self):
        super().__init__("appeal_packets")


class CallLogsRepository(BaseRepository):
    def __init__(self):
        super().__init__("call_logs")

    async def get_by_bill(self, bill_id: str) -> list:
        cursor = self.collection.find(
            {"bill_id": bill_id},
            {"transcript": 0, "ai_responses": 0},
        ).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        return docs

    async def append_transcript(self, call_id: str, entry: dict):
        await self.collection.update_one(
            {"_id": ObjectId(call_id)},
            {"$push": {"transcript": entry}, "$set": {"updated_at": datetime.utcnow()}},
        )


# Singleton instances
bills_repo = BillsRepository()
line_items_repo = LineItemsRepository()
benchmark_results_repo = BenchmarkResultsRepository()
appeal_packets_repo = AppealPacketsRepository()
call_logs_repo = CallLogsRepository()

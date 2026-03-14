# Demo Router — /api/demo/seed

from fastapi import APIRouter
from db.repositories import bills_repo, line_items_repo

router = APIRouter()


@router.post("/seed")
async def seed_demo_data():
    """Load pre-built demo ER scenario into MongoDB (skips S3/Textract)."""
    # TODO: Load data/demo_bill.json
    # TODO: Insert bill record + line items + benchmark results
    # TODO: Return { bill_id, message: "Demo data seeded" }
    pass

# Insurance Service — Insurance rule matching via Gemini

from services.gemini_service import match_insurance_rules


async def get_insurance_insights(bill_metadata: dict, line_items: list, errors: list) -> dict:
    """Fetch insurance rule matching results and appeal strategies."""
    return await match_insurance_rules(bill_metadata, line_items, errors)

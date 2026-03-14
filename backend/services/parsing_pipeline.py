# Parsing Pipeline — Full pipeline orchestration (steps 1-12)

from db.repositories import bills_repo, line_items_repo, benchmark_results_repo
from services.textract_service import run_textract
from services.gemini_service import (
    classify_document,
    extract_line_items,
    generate_explanation,
    detect_errors_ai,
    match_insurance_rules,
)
from services.benchmark_service import run_benchmarks
from services.error_detection_service import run_rule_based_checks


async def run_parsing_pipeline(bill_id: str) -> None:
    """
    Full async pipeline triggered by upload:
    1. Run Textract on each S3 document
    2. Extract raw text + tables from Textract response
    3. Gemini: classify document type
    4. Gemini: extract structured line items
    5. Store line items in MongoDB
    6. Benchmark lookup + deviation calculation
    7. Store benchmark results
    8. Error detection: rule-based + Gemini AI pass
    9. Update line items with flags and risk_level
    10. Gemini: match insurance rules
    11. Gemini: generate plain-language explanation
    12. Calculate totals, update bill status to "completed"
    """
    try:
        # TODO: Implement each step
        # Step 1-2: Textract
        # Step 3: Classification
        # Step 4: Extraction
        # Step 5: Store line items
        # Step 6-7: Benchmarking
        # Step 8-9: Error detection
        # Step 10: Insurance rules
        # Step 11: Explanation
        # Step 12: Finalize

        await bills_repo.update_status(bill_id, "completed")
    except Exception as e:
        await bills_repo.update_status(bill_id, "failed", error=str(e))
        raise

# Parsing Pipeline — Full pipeline orchestration (14+ steps)
#
# Supports two modes:
# - Local: Triggered by FastAPI BackgroundTasks (for dev without AWS infrastructure)
# - AWS: Steps 1-6 handled by Lambda (Textract + Comprehend Medical),
#         steps 7-16 handled by this pipeline reading results from MongoDB

from db.repositories import bills_repo, line_items_repo, benchmark_results_repo
from services.textract_service import run_textract
from services.comprehend_service import detect_medical_entities, entities_to_json_context
from services.gemini_service import (
    classify_document,
    extract_line_items,
    generate_explanation,
    detect_errors_ai,
    match_insurance_rules,
)
from services.benchmark_service import run_benchmarks
from services.error_detection_service import run_rule_based_checks
from utils.textract_parser import parse_textract_response


async def run_parsing_pipeline(bill_id: str) -> None:
    """
    Full async pipeline — 16 steps total.

    In local mode, runs everything:
    1. Run Textract on each S3 document
    2. Extract raw text + tables from Textract response
    3. Run Comprehend Medical on raw text → medical entities
    4. Merge Comprehend Medical entities with Textract output
    5. Gemini: classify document type (with Comprehend entities as context)
    6. Gemini: extract structured line items (with Comprehend normalized codes)
    7. Store line items in MongoDB
    8. Benchmark lookup + deviation calculation
    9. Store benchmark results
    10. Error detection: rule-based + Gemini AI pass
    11. Update line items with flags and risk_level
    12. Gemini: match insurance rules
    13. Gemini: generate plain-language explanation
    14. Calculate totals, update bill status to "completed"

    In AWS mode, steps 1-4 are handled by Lambda. This function
    picks up from step 5 using pre-stored Textract + Comprehend results.
    """
    try:
        bill = await bills_repo.get_by_id(bill_id)
        if not bill:
            raise ValueError(f"Bill {bill_id} not found")

        from config import settings

        if settings.pipeline_mode == "aws":
            # AWS mode: Lambda already ran Textract + Comprehend Medical
            # Results are stored in bill.textract_results and bill.comprehend_results
            textract_data = bill.get("textract_results", [{}])[0]
            comprehend_data = bill.get("comprehend_results", [{}])[0]
            raw_text = textract_data.get("raw_text", "")
            comprehend_context = entities_to_json_context(comprehend_data) if comprehend_data else "{}"
        else:
            # Local mode: run Textract + Comprehend ourselves
            await bills_repo.update_status(bill_id, "processing")

            # Step 1-2: Textract
            s3_keys = bill.get("s3_keys", [])
            raw_text = ""
            for key in s3_keys:
                textract_response = await run_textract(key)
                parsed = parse_textract_response(textract_response)
                raw_text += parsed["raw_text"] + "\n"

            # Step 3-4: Comprehend Medical
            comprehend_entities = await detect_medical_entities(raw_text)
            comprehend_context = entities_to_json_context(comprehend_entities)

        # Step 5: Gemini — classify document type
        # TODO: classification = await classify_document(raw_text, comprehend_context)

        # Step 6: Gemini — extract structured line items
        # TODO: items = await extract_line_items(raw_text, comprehend_context, classification)

        # Step 7: Store line items in MongoDB
        # TODO: await line_items_repo.bulk_create(items)

        # Step 8-9: Benchmark lookup + store results
        # TODO: benchmark_results = run_benchmarks(items)
        # TODO: await benchmark_results_repo.bulk_create(benchmark_results)

        # Step 10-11: Error detection
        # TODO: rule_flags = run_rule_based_checks(items, bill)
        # TODO: ai_flags = await detect_errors_ai(items, rule_flags)

        # Step 12: Insurance rules
        # TODO: insights = await match_insurance_rules(items, bill)

        # Step 13: Plain-language explanation
        # TODO: explanation = await generate_explanation(items, bill)

        # Step 14: Finalize
        await bills_repo.update_status(bill_id, "completed")

    except Exception as e:
        await bills_repo.update_status(bill_id, "failed", error=str(e))
        raise

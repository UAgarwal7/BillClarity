# Parsing Pipeline — Full pipeline orchestration (14+ steps)
#
# Supports two modes:
# - Local: Triggered by FastAPI BackgroundTasks (for dev without AWS infrastructure)
# - AWS: Steps 1-4 handled by Lambda (Textract + Comprehend Medical),
#         steps 5-14 handled by this pipeline reading results from MongoDB

import json
import asyncio
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


async def run_parsing_pipeline(bill_id: str) -> None:
    """
    Full async pipeline — 14 steps total.

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

        raw_text = ""
        tables_json = "[]"
        kv_pairs_json = "{}"
        comprehend_context = "{}"

        if settings.pipeline_mode == "aws":
            # AWS mode: Lambda already ran Textract + Comprehend Medical
            # Results are stored in bill.textract_results and bill.comprehend_results
            textract_data = bill.get("textract_results", [{}])
            if textract_data and len(textract_data) > 0:
                first = textract_data[0] if isinstance(textract_data, list) else textract_data
                raw_text = first.get("raw_text", "")
                tables_json = first.get("tables_json", "[]")
                kv_pairs_json = first.get("kv_pairs_json", "{}")

            comprehend_data = bill.get("comprehend_results", {})
            if isinstance(comprehend_data, list) and len(comprehend_data) > 0:
                comprehend_data = comprehend_data[0]
            elif isinstance(comprehend_data, list):
                comprehend_data = {}
                
            comprehend_context = entities_to_json_context(comprehend_data) if comprehend_data else "{}"
        else:
            # Local mode: run Textract + Comprehend ourselves
            await bills_repo.update_status(bill_id, "processing")

            # Step 1-2: Textract
            s3_keys = bill.get("s3_keys", [])
            all_raw_text = []
            all_tables = []
            all_kv = {}

            for key in s3_keys:
                textract_response = await run_textract(key)
                all_raw_text.append(textract_response.get("raw_text", ""))
                tables = json.loads(textract_response.get("tables_json", "[]"))
                all_tables.extend(tables)
                kvs = json.loads(textract_response.get("kv_pairs_json", "{}"))
                all_kv.update(kvs)

            raw_text = "\n".join(all_raw_text)
            tables_json = json.dumps(all_tables)
            kv_pairs_json = json.dumps(all_kv)

            # Step 3-4: Comprehend Medical
            try:
                comprehend_entities = await detect_medical_entities(raw_text)
                comprehend_context = entities_to_json_context(comprehend_entities)
            except Exception:
                # Comprehend is optional — continue without it
                comprehend_context = "{}"

        # ----- Steps 5-14: AI analysis (runs in both modes) -----

        # Step 5: Gemini — classify document type
        classification = await classify_document(raw_text[:4000])
        doc_type = classification.get("type", "unknown")
        doc_confidence = classification.get("confidence", 0.0)

        # Update bill with document type
        await bills_repo.update(bill_id, {
            "document_type": doc_type,
        })

        # Step 6: Gemini — extract structured line items
        extraction = await extract_line_items(
            doc_type=doc_type,
            doc_confidence=doc_confidence,
            raw_text=raw_text,
            tables_json=tables_json,
            kv_pairs_json=kv_pairs_json,
        )

        # Handle extraction result
        bill_metadata_extracted = extraction.get("bill_metadata", {})
        items = extraction.get("line_items", [])

        # Update bill metadata from extraction
        meta_update = {}
        for field in ["provider", "facility", "total_billed", "total_allowed",
                       "total_insurance_paid", "patient_balance", "insurance_provider"]:
            val = bill_metadata_extracted.get(field)
            if val is not None:
                meta_update[field] = val

        date_range = bill_metadata_extracted.get("service_date_range")
        if date_range:
            meta_update["service_date_range"] = date_range

        # Compute confidence scores
        field_confidences = {}
        for item in items:
            for field, val in item.items():
                if val is not None and field != "confidence":
                    field_confidences[field] = max(
                        field_confidences.get(field, 0),
                        item.get("confidence", 0.5),
                    )
        overall_confidence = (
            sum(field_confidences.values()) / len(field_confidences)
            if field_confidences else 0.0
        )
        meta_update["confidence_scores"] = {
            "overall": round(overall_confidence, 2),
            "fields": {k: round(v, 2) for k, v in field_confidences.items()},
        }

        if meta_update:
            await bills_repo.update(bill_id, meta_update)

        # Step 7: Store line items in MongoDB
        for item in items:
            item["bill_id"] = bill_id
            item.setdefault("flags", [])
            item.setdefault("risk_level", "normal")
        line_item_ids = await line_items_repo.bulk_create(items)

        # Attach IDs back to items for downstream use
        for item, lid in zip(items, line_item_ids):
            item["_id"] = lid

        # Step 8-9: Benchmark lookup + store results
        benchmark_results = await run_benchmarks(items)
        if benchmark_results:
            await benchmark_results_repo.bulk_create(benchmark_results)

        # Step 10: Error detection — rule-based checks
        # Re-fetch bill for updated metadata
        bill = await bills_repo.get_by_id(bill_id)
        rule_flags = run_rule_based_checks(items, bill or {})

        # Step 10b: Error detection — AI augmented pass
        try:
            ai_flags = await detect_errors_ai(bill or {}, items)
        except Exception:
            ai_flags = []  # AI detection is best-effort

        all_flags = rule_flags + (ai_flags if isinstance(ai_flags, list) else [])

        # Step 11: Update line items with flags and risk_level
        for flag in all_flags:
            idx = flag.get("line_item_index")
            if idx is not None and idx < len(items):
                item_id = items[idx].get("_id")
                if item_id:
                    risk = "high_risk" if flag.get("severity") == "critical" else (
                        "needs_review" if flag.get("severity") == "warning" else "normal"
                    )
                    flag_data = {
                        "type": flag.get("type", "unknown"),
                        "message": flag.get("message", ""),
                        "severity": flag.get("severity", "info"),
                        "suggested_action": flag.get("suggested_action", ""),
                    }
                    await line_items_repo.collection.update_one(
                        {"_id": item_id} if not isinstance(item_id, str) else {"_id": __import__("bson").ObjectId(item_id)},
                        {
                            "$push": {"flags": flag_data},
                            "$set": {"risk_level": risk, "updated_at": __import__("datetime").datetime.utcnow()},
                        },
                    )

        # Step 12: Gemini — match insurance rules
        try:
            insights = await match_insurance_rules(bill or {}, items, all_flags)
            await bills_repo.update(bill_id, {"insurance_insights": insights})
        except Exception:
            pass  # Insurance matching is best-effort

        # Step 13: Gemini — generate plain-language explanation
        try:
            explanation = await generate_explanation(bill or {}, items)
            await bills_repo.update(bill_id, {"plain_language_summary": explanation})
        except Exception:
            pass  # Explanation is best-effort

        # Step 14: Calculate totals, update bill status to "completed"
        totals = _calculate_totals(items)
        await bills_repo.update(bill_id, {
            **totals,
            "parsing_status": "completed",
        })

        # Step 15: Auto-generate appeal packet
        try:
            from services.appeal_service import generate_packet
            bill = await bills_repo.get_by_id(bill_id)
            errors = []
            for item in items:
                for flag in item.get("flags", []):
                    errors.append({
                        **flag,
                        "description": item.get("description", "Unknown"),
                        "code": item.get("code"),
                        "affected_amount": item.get("billed_amount"),
                    })
            await generate_packet(
                bill_id=bill_id,
                bill_metadata=bill or {},
                line_items=items,
                errors=errors,
                benchmarks=benchmark_results or [],
                insights=bill.get("insurance_insights", {"insights": [], "appeal_triggers": []}) if bill else {},
                selected_sections=[
                    "bill_explanation", "flagged_issues", "benchmark_analysis",
                    "insurance_insights", "appeal_letter", "negotiation_script",
                ],
            )
        except Exception:
            pass  # Appeal packet is best-effort

    except Exception as e:
        await bills_repo.update_status(bill_id, "failed", error=str(e))
        raise


def _calculate_totals(line_items: list) -> dict:
    """Calculate aggregate totals from line items."""
    total_billed = sum(item.get("billed_amount", 0) or 0 for item in line_items)
    total_allowed = sum(item.get("allowed_amount", 0) or 0 for item in line_items)
    total_insurance_paid = sum(item.get("insurance_paid", 0) or 0 for item in line_items)
    total_patient = sum(item.get("patient_responsibility", 0) or 0 for item in line_items)

    return {
        "total_billed": round(total_billed, 2),
        "total_allowed": round(total_allowed, 2),
        "total_insurance_paid": round(total_insurance_paid, 2),
        "patient_balance": round(total_patient, 2),
    }

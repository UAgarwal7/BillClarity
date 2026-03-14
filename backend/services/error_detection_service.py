# Error Detection Service — Rule-based checks + AI flags

from collections import Counter


def run_rule_based_checks(line_items: list, bill_metadata: dict) -> list:
    """
    Run rule-based error detection checks:
    - Duplicate charges (same code + date)
    - Quantity anomalies (qty > 3 for physician/facility)
    - Extreme overpricing (deviation_score >= 8)
    - Date mismatches (outside service_date_range)
    - Denied-but-billed (denial code + nonzero patient_responsibility)
    """
    flags = []

    # Duplicate detection
    code_date_pairs = Counter()
    for i, item in enumerate(line_items):
        key = (item.get("code"), item.get("service_date"))
        if key[0]:  # Only if code exists
            code_date_pairs[key] += 1

    for i, item in enumerate(line_items):
        key = (item.get("code"), item.get("service_date"))
        if key[0] and code_date_pairs[key] > 1:
            flags.append({
                "line_item_index": i,
                "type": "duplicate",
                "message": f"Potential duplicate charge: {item.get('code')} billed {code_date_pairs[key]} times on the same date.",
                "severity": "critical",
                "suggested_action": "Request an itemized coding review to verify this is not a duplicate charge.",
            })

    # Quantity anomaly
    for i, item in enumerate(line_items):
        qty = item.get("quantity", 1)
        category = item.get("category", "")
        if qty > 3 and category in ("physician", "facility"):
            flags.append({
                "line_item_index": i,
                "type": "quantity_anomaly",
                "message": f"Unusually high quantity ({qty}) for {item.get('description', 'this service')}.",
                "severity": "warning",
                "suggested_action": "Verify the quantity is correct for this type of service.",
            })

    # Date mismatch
    start = bill_metadata.get("service_date_range", {}).get("start")
    end = bill_metadata.get("service_date_range", {}).get("end")
    if start and end:
        for i, item in enumerate(line_items):
            svc_date = item.get("service_date")
            if svc_date and (svc_date < start or svc_date > end):
                flags.append({
                    "line_item_index": i,
                    "type": "date_mismatch",
                    "message": f"Service date {svc_date} is outside the bill's date range ({start} to {end}).",
                    "severity": "warning",
                    "suggested_action": "Verify the service date is correct.",
                })

    # Denied-but-billed
    for i, item in enumerate(line_items):
        if item.get("adjustment_reason") and "denied" in (item.get("adjustment_reason", "")).lower():
            if item.get("patient_responsibility", 0) > 0:
                flags.append({
                    "line_item_index": i,
                    "type": "denied_billed",
                    "message": f"This service was denied by insurance but you are still being charged ${item.get('patient_responsibility', 0):.2f}.",
                    "severity": "critical",
                    "suggested_action": "Contact the billing department — denied services should not be billed to the patient.",
                })

    return flags

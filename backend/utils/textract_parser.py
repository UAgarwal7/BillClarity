# Textract Parser — Parse Textract JSON response → raw text + tables + KV pairs


def parse_textract_response(response: dict) -> dict:
    """Parse AWS Textract response into structured components."""
    raw_text = ""
    tables = []
    kv_pairs = {}

    blocks = response.get("Blocks", [])

    # Extract raw text from LINE blocks
    for block in blocks:
        if block["BlockType"] == "LINE":
            raw_text += block.get("Text", "") + "\n"

    # TODO: Extract table structures
    # TODO: Extract key-value pairs from FORMS

    return {
        "raw_text": raw_text.strip(),
        "tables": tables,
        "kv_pairs": kv_pairs,
    }

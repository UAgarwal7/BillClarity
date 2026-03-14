# Textract Parser — Parse Textract JSON response → raw text + tables + KV pairs

import json


def parse_textract_response(response: dict) -> dict:
    """Parse AWS Textract response into structured components.

    Returns:
        {
            "raw_text": str,
            "tables_json": str (JSON array of tables),
            "kv_pairs_json": str (JSON object of key-value pairs),
        }
    """
    blocks = response.get("Blocks", [])

    # Build lookup maps
    block_map = {}
    for block in blocks:
        block_map[block["Id"]] = block

    raw_text = _extract_raw_text(blocks)
    tables = _extract_tables(blocks, block_map)
    kv_pairs = _extract_kv_pairs(blocks, block_map)

    return {
        "raw_text": raw_text,
        "tables_json": json.dumps(tables),
        "kv_pairs_json": json.dumps(kv_pairs),
    }


def _extract_raw_text(blocks: list) -> str:
    """Extract plain text from LINE blocks, preserving order."""
    lines = []
    for block in blocks:
        if block["BlockType"] == "LINE":
            lines.append(block.get("Text", ""))
    return "\n".join(lines)


def _extract_tables(blocks: list, block_map: dict) -> list:
    """Extract table structures from TABLE and CELL blocks.

    Returns list of tables, each table is list of rows, each row is list of cell values.
    """
    tables = []

    for block in blocks:
        if block["BlockType"] != "TABLE":
            continue

        table_cells = {}
        if "Relationships" not in block:
            continue

        for rel in block["Relationships"]:
            if rel["Type"] == "CHILD":
                for child_id in rel["Ids"]:
                    cell = block_map.get(child_id)
                    if cell and cell["BlockType"] == "CELL":
                        row_idx = cell.get("RowIndex", 0)
                        col_idx = cell.get("ColumnIndex", 0)
                        cell_text = _get_text_from_block(cell, block_map)
                        if row_idx not in table_cells:
                            table_cells[row_idx] = {}
                        table_cells[row_idx][col_idx] = cell_text

        # Convert to list of lists
        if table_cells:
            max_row = max(table_cells.keys())
            max_col = max(
                col for row in table_cells.values() for col in row.keys()
            )
            table = []
            for r in range(1, max_row + 1):
                row = []
                for c in range(1, max_col + 1):
                    row.append(table_cells.get(r, {}).get(c, ""))
                table.append(row)
            tables.append(table)

    return tables


def _extract_kv_pairs(blocks: list, block_map: dict) -> dict:
    """Extract key-value pairs from FORMS feature (KEY_VALUE_SET blocks)."""
    kv_pairs = {}

    key_blocks = [b for b in blocks if b["BlockType"] == "KEY_VALUE_SET" and "KEY" in b.get("EntityTypes", [])]

    for key_block in key_blocks:
        key_text = _get_text_from_block(key_block, block_map)
        value_text = ""

        # Find the VALUE block linked to this KEY
        for rel in key_block.get("Relationships", []):
            if rel["Type"] == "VALUE":
                for val_id in rel["Ids"]:
                    val_block = block_map.get(val_id)
                    if val_block:
                        value_text = _get_text_from_block(val_block, block_map)

        if key_text:
            kv_pairs[key_text.strip()] = value_text.strip()

    return kv_pairs


def _get_text_from_block(block: dict, block_map: dict) -> str:
    """Get concatenated text from a block's CHILD WORD blocks."""
    text_parts = []
    for rel in block.get("Relationships", []):
        if rel["Type"] == "CHILD":
            for child_id in rel["Ids"]:
                child = block_map.get(child_id)
                if child and child["BlockType"] == "WORD":
                    text_parts.append(child.get("Text", ""))
    return " ".join(text_parts)

// LineItemsTable — Sortable table of all extracted charges

import React from "react";
import type { LineItem } from "@/app/types/line-item";

interface LineItemsTableProps {
  lineItems: LineItem[];
  onItemClick?: (item: LineItem) => void;
}

export function LineItemsTable({ lineItems, onItemClick }: LineItemsTableProps) {
  // TODO: Sortable columns: date, description, code, qty, billed, allowed, paid, patient
  // TODO: Risk badge per row
  // TODO: Click to expand detail drawer
  return (
    <table className="line-items-table">
      {/* Table header + body */}
    </table>
  );
}

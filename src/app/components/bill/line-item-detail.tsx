// LineItemDetail — Expandable drawer with per-item explanation and flags

import React from "react";
import type { LineItem } from "@/app/types/line-item";

interface LineItemDetailProps {
  item: LineItem;
  explanation?: string;
  onClose: () => void;
}

export function LineItemDetail({ item, explanation, onClose }: LineItemDetailProps) {
  // TODO: Full item details (all fields)
  // TODO: Plain-language explanation from Gemini
  // TODO: Flags list with severity badges
  // TODO: Benchmark comparison if available
  return (
    <div className="line-item-detail">
      {/* Detail drawer content */}
    </div>
  );
}

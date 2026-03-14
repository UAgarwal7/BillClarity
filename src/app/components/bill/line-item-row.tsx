// LineItemRow — Single table row with risk badge and confidence indicator

import React from "react";
import type { LineItem } from "@/app/types/line-item";

interface LineItemRowProps {
  item: LineItem;
  onClick?: () => void;
}

export function LineItemRow({ item, onClick }: LineItemRowProps) {
  // TODO: Render all fields in table columns
  // TODO: RiskBadge component for risk_level
  // TODO: ConfidenceBadge for extraction confidence
  // TODO: Flag icons if line item has flags
  return (
    <tr className="line-item-row" onClick={onClick}>
      {/* Table cells */}
    </tr>
  );
}

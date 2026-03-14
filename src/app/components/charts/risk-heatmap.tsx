// RiskHeatmap — Color-coded grid of line items by risk level
// Green (normal), Yellow (needs review), Red (high risk)

import React from "react";
import type { LineItem } from "@/app/types/line-item";

interface RiskHeatmapProps {
  lineItems: LineItem[];
  onItemClick?: (item: LineItem) => void;
}

export function RiskHeatmap({ lineItems, onItemClick }: RiskHeatmapProps) {
  // TODO: Grid/table layout with color-coded cells
  // TODO: Hover tooltip with risk reason
  // TODO: Click to show detail
  return (
    <div className="risk-heatmap">
      {/* Heatmap grid */}
    </div>
  );
}

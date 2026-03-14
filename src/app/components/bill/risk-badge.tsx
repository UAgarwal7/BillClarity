// RiskBadge — Green / Yellow / Red risk level badge

import React from "react";
import type { RiskLevel } from "@/app/types/line-item";

interface RiskBadgeProps {
  level: RiskLevel; // "normal" | "needs_review" | "high_risk"
}

export function RiskBadge({ level }: RiskBadgeProps) {
  // TODO: Map level to color and label
  // TODO: Icon + text badge
  return (
    <span className="risk-badge">
      {/* Badge */}
    </span>
  );
}

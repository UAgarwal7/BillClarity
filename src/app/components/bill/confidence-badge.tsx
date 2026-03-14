// ConfidenceBadge — High / Medium / Low confidence indicator

import React from "react";

interface ConfidenceBadgeProps {
  confidence: number; // 0.0 – 1.0
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  // TODO: Map confidence to level: High (>=0.85), Medium (0.6-0.84), Low (<0.6)
  // TODO: Color-coded badge
  return (
    <span className="confidence-badge">
      {/* Badge */}
    </span>
  );
}

// InsightCard — Single insurance rule/protection with applicability

import React from "react";
import type { InsuranceInsight } from "@/app/types/analysis";

interface InsightCardProps {
  insight: InsuranceInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  // TODO: Rule name header
  // TODO: Plain-language description
  // TODO: Applicability to this bill
  // TODO: Strength badge (strong/moderate/weak)
  // TODO: Appeal strategy if applicable
  return (
    <div className="insight-card">
      {/* Insight content */}
    </div>
  );
}

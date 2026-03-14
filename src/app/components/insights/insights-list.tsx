// InsightsList — Scrollable list of insurance insights + appeal triggers

import React from "react";
import type { InsuranceInsight, AppealTrigger } from "@/app/types/analysis";

interface InsightsListProps {
  insights: InsuranceInsight[];
  appealTriggers: AppealTrigger[];
}

export function InsightsList({ insights, appealTriggers }: InsightsListProps) {
  // TODO: Section header for insights
  // TODO: Render InsightCard for each
  // TODO: Section header for appeal triggers
  // TODO: Render AppealTriggerCard for each
  return (
    <div className="insights-list">
      {/* Insights + triggers */}
    </div>
  );
}

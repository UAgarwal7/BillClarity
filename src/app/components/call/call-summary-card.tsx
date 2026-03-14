// CallSummaryCard — Post-call outcome, next steps

import React from "react";

interface CallSummaryCardProps {
  summary: string;
  outcome: string;
  nextSteps: string;
}

export function CallSummaryCard({
  summary,
  outcome,
  nextSteps,
}: CallSummaryCardProps) {
  // TODO: Call summary text
  // TODO: Outcome badge
  // TODO: Next steps list
  return (
    <div className="call-summary-card">
      {/* Summary content */}
    </div>
  );
}

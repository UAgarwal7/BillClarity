// ErrorSummaryBar — Critical / Warning / Info counts at a glance

import React from "react";

interface ErrorSummaryBarProps {
  critical: number;
  warning: number;
  info: number;
}

export function ErrorSummaryBar({ critical, warning, info }: ErrorSummaryBarProps) {
  // TODO: Three count badges with colors
  return (
    <div className="error-summary-bar">
      {/* Count badges */}
    </div>
  );
}

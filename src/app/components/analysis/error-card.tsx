// ErrorCard — Single error with severity, message, and suggested action

import React from "react";
import type { ErrorRecord } from "@/app/types/analysis";

interface ErrorCardProps {
  error: ErrorRecord;
}

export function ErrorCard({ error }: ErrorCardProps) {
  // TODO: Severity badge (critical/warning/info)
  // TODO: Error type label
  // TODO: Patient-friendly message
  // TODO: Suggested action
  // TODO: Affected amount if applicable
  return (
    <div className="error-card">
      {/* Error content */}
    </div>
  );
}

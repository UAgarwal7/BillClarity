// ErrorList — Filterable list of all flagged billing issues

import React from "react";
import type { ErrorRecord } from "@/app/types/analysis";

interface ErrorListProps {
  errors: ErrorRecord[];
  onFilterChange?: (severity: string | null) => void;
}

export function ErrorList({ errors, onFilterChange }: ErrorListProps) {
  // TODO: Filter tabs: All / Critical / Warning / Info
  // TODO: Render ErrorCard for each error
  // TODO: Sort by severity (critical first)
  return (
    <div className="error-list">
      {/* Filter tabs + error cards */}
    </div>
  );
}

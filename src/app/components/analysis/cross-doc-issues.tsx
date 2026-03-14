// CrossDocIssues — Bill vs. EOB mismatch details

import React from "react";

interface CrossDocIssue {
  type: string;
  message: string;
  billValue?: string;
  eobValue?: string;
}

interface CrossDocIssuesProps {
  issues: CrossDocIssue[];
}

export function CrossDocIssues({ issues }: CrossDocIssuesProps) {
  // TODO: List of mismatch items with side-by-side comparison
  return (
    <div className="cross-doc-issues">
      {/* Cross-document issue cards */}
    </div>
  );
}

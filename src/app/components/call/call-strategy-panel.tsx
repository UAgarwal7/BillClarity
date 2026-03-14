// CallStrategyPanel — Pre-call strategy display

import React from "react";

interface CallStrategyPanelProps {
  strategy: string;
  keyPoints: string[];
}

export function CallStrategyPanel({ strategy, keyPoints }: CallStrategyPanelProps) {
  // TODO: Strategy summary text
  // TODO: Bullet list of key evidence points
  return (
    <div className="call-strategy-panel">
      {/* Strategy content */}
    </div>
  );
}

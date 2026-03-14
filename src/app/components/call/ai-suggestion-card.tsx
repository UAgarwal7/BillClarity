// AiSuggestionCard — AI response + strategic note display

import React from "react";

interface AiSuggestionCardProps {
  response: string;
  strategicNote: string;
  escalate?: boolean;
}

export function AiSuggestionCard({
  response,
  strategicNote,
  escalate,
}: AiSuggestionCardProps) {
  // TODO: Suggested response text (ready to speak/say)
  // TODO: Strategic note (tip, not spoken)
  // TODO: Escalation indicator if needed
  return (
    <div className="ai-suggestion-card">
      {/* AI suggestion content */}
    </div>
  );
}

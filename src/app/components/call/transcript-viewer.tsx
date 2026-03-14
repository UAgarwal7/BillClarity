// TranscriptViewer — Full scrollable transcript

import React from "react";

interface TranscriptEntry {
  role: "agent" | "representative" | "system";
  text: string;
  timestamp: string;
}

interface TranscriptViewerProps {
  transcript: TranscriptEntry[];
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  // TODO: Scrollable list of ChatMessage components
  // TODO: Auto-scroll to bottom on new messages
  return (
    <div className="transcript-viewer">
      {/* Transcript messages */}
    </div>
  );
}

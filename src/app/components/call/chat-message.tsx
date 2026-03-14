// ChatMessage — Single message bubble (user / representative / AI)

import React from "react";

interface ChatMessageProps {
  role: "agent" | "representative" | "system";
  text: string;
  timestamp?: string;
}

export function ChatMessage({ role, text, timestamp }: ChatMessageProps) {
  // TODO: Role-specific bubble styling and alignment
  // TODO: Timestamp display
  return (
    <div className={`chat-message chat-message--${role}`}>
      {/* Message bubble */}
    </div>
  );
}

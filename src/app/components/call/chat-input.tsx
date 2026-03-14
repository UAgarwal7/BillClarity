// ChatInput — Text input for simulated call conversation

import React from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  // TODO: Text input with send button
  // TODO: Enter to send
  // TODO: Disabled state during AI processing
  return (
    <div className="chat-input">
      {/* Input + send button */}
    </div>
  );
}

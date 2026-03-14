// MarkdownRenderer — Render markdown strings to HTML safely

import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // TODO: Parse markdown to HTML (use a lightweight parser)
  // TODO: Sanitize HTML output
  return (
    <div className={`markdown-renderer ${className ?? ""}`}>
      {/* Rendered markdown */}
    </div>
  );
}

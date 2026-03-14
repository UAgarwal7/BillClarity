// SectionEditor — Inline markdown editor for an appeal packet section

import React from "react";

interface SectionEditorProps {
  sectionKey: string;
  title: string;
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function SectionEditor({
  sectionKey,
  title,
  initialContent,
  onSave,
  onCancel,
}: SectionEditorProps) {
  // TODO: Textarea with markdown content
  // TODO: Live preview toggle
  // TODO: Save / Cancel buttons
  return (
    <div className="section-editor">
      {/* Markdown editor */}
    </div>
  );
}

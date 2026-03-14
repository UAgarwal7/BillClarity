// SectionPreview — Rendered markdown preview of an appeal packet section

import React from "react";

interface SectionPreviewProps {
  sectionKey: string;
  title: string;
  markdownContent: string;
  onEdit: () => void;
  onRegenerate: () => void;
}

export function SectionPreview({
  sectionKey,
  title,
  markdownContent,
  onEdit,
  onRegenerate,
}: SectionPreviewProps) {
  // TODO: Render markdown to HTML
  // TODO: Edit and Regenerate buttons
  return (
    <div className="section-preview">
      {/* Rendered markdown + actions */}
    </div>
  );
}

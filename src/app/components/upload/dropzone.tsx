// Dropzone — Drag-and-drop file upload area
// Accepts PDF, PNG, JPG, HEIC (max 10MB per file)

import React from "react";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
}

export function Dropzone({
  onFilesSelected,
  acceptedTypes = [".pdf", ".png", ".jpg", ".jpeg", ".heic"],
  maxSizeMB = 10,
  disabled = false,
}: DropzoneProps) {
  // TODO: Implement drag-and-drop handlers
  // TODO: Implement file validation (type, size)
  // TODO: Visual feedback for drag-over state
  return (
    <div className="dropzone">
      {/* Drop area with icon, label, accepted formats */}
    </div>
  );
}

// FilePreview — Thumbnail/filename/size preview for each uploaded file

import React from "react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  // TODO: Show file thumbnail (PDF icon or image preview)
  // TODO: Display filename + file size
  // TODO: Remove button
  return (
    <div className="file-preview">
      {/* File icon/thumbnail, name, size, remove button */}
    </div>
  );
}

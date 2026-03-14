// PdfExportButton — Download PDF trigger with loading state

import React from "react";

interface PdfExportButtonProps {
  packetId: string;
  disabled?: boolean;
}

export function PdfExportButton({ packetId, disabled }: PdfExportButtonProps) {
  // TODO: Click handler to call GET /api/appeal-packets/:id/pdf
  // TODO: Loading spinner during generation
  // TODO: Trigger file download
  return (
    <button className="pdf-export-button" disabled={disabled}>
      {/* Export PDF */}
    </button>
  );
}

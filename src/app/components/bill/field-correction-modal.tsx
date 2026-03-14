// FieldCorrectionModal — Modal for correcting low-confidence extracted fields

import React from "react";
import type { LineItem } from "@/app/types/line-item";

interface FieldCorrectionModalProps {
  lineItem: LineItem;
  open: boolean;
  onClose: () => void;
  onSubmit: (corrections: Record<string, string | number>) => void;
}

export function FieldCorrectionModal({
  lineItem,
  open,
  onClose,
  onSubmit,
}: FieldCorrectionModalProps) {
  // TODO: Show fields with low confidence highlighted
  // TODO: Editable inputs for each field
  // TODO: Submit corrections to backend
  return open ? (
    <div className="field-correction-modal">
      {/* Modal content */}
    </div>
  ) : null;
}

// LoadingSpinner — Spinner with optional label

import React from "react";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ label, size = "md" }: LoadingSpinnerProps) {
  // TODO: Animated spinner
  // TODO: Optional label below
  return (
    <div className="loading-spinner">
      {/* Spinner + label */}
    </div>
  );
}

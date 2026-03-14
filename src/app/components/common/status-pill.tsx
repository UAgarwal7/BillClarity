// StatusPill — Generic status indicator pill

import React from "react";

interface StatusPillProps {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function StatusPill({ status, variant = "default" }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${variant}`}>
      {status}
    </span>
  );
}

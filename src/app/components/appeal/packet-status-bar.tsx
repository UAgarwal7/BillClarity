// PacketStatusBar — Generating / Draft / Finalized status indicator

import React from "react";
import type { PacketStatus } from "@/app/types/appeal-packet";

interface PacketStatusBarProps {
  status: PacketStatus;
}

export function PacketStatusBar({ status }: PacketStatusBarProps) {
  // TODO: Status pill with icon
  // TODO: Progress indicator if generating
  return (
    <div className="packet-status-bar">
      {/* Status indicator */}
    </div>
  );
}

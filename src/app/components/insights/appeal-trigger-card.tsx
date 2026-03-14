// AppealTriggerCard — Appeal trigger with success likelihood indicator

import React from "react";
import type { AppealTrigger } from "@/app/types/analysis";

interface AppealTriggerCardProps {
  trigger: AppealTrigger;
}

export function AppealTriggerCard({ trigger }: AppealTriggerCardProps) {
  // TODO: Trigger description
  // TODO: Success likelihood badge (high/moderate/low)
  // TODO: Reasoning text
  return (
    <div className="appeal-trigger-card">
      {/* Trigger content */}
    </div>
  );
}

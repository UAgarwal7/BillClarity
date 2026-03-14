// SavingsSummaryCard — Total estimated savings low/high display

import React from "react";

interface SavingsSummaryCardProps {
  itemsAboveTypical: number;
  estimatedSavingsLow: number;
  estimatedSavingsHigh: number;
}

export function SavingsSummaryCard({
  itemsAboveTypical,
  estimatedSavingsLow,
  estimatedSavingsHigh,
}: SavingsSummaryCardProps) {
  // TODO: Card with savings range display
  // TODO: Count of items above typical
  return (
    <div className="savings-summary-card">
      {/* Savings display */}
    </div>
  );
}

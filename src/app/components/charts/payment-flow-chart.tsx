// PaymentFlowChart — Billed → Allowed → Paid → Patient Owes flow visualization
// Horizontal stacked bar or Sankey-style diagram

import React from "react";

interface PaymentFlowChartProps {
  totalBilled: number;
  totalAllowed: number;
  insurancePaid: number;
  patientBalance: number;
}

export function PaymentFlowChart({
  totalBilled,
  totalAllowed,
  insurancePaid,
  patientBalance,
}: PaymentFlowChartProps) {
  // TODO: Horizontal stacked bar showing financial flow
  // TODO: Adjustment/write-off segment
  // TODO: Labels with dollar amounts
  return (
    <div className="payment-flow-chart">
      {/* Flow visualization */}
    </div>
  );
}

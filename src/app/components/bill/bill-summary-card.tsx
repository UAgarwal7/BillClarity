// BillSummaryCard — Provider, dates, totals at a glance

import React from "react";
import type { Bill } from "@/app/types/bill";

interface BillSummaryCardProps {
  bill: Bill;
}

export function BillSummaryCard({ bill }: BillSummaryCardProps) {
  // TODO: Provider name + facility
  // TODO: Service date range
  // TODO: Insurance provider
  // TODO: Totals row: billed, allowed, insurance paid, patient owes
  // TODO: Parsing status indicator
  return (
    <div className="bill-summary-card">
      {/* Summary card content */}
    </div>
  );
}

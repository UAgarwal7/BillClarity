// useBill — Fetch + poll bill status until completed/failed

import { useState, useEffect } from "react";
import type { Bill } from "@/app/types/bill";

export function useBill(billId: string | null) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch bill by ID
  // TODO: Poll every 2s while parsing_status is "processing"
  // TODO: Stop polling on "completed" or "failed"

  return { bill, loading, error };
}

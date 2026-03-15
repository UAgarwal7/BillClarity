// useLineItems — Fetch line items for a bill

import { useState, useEffect } from "react";
import type { LineItem } from "@/app/types/line-item";
import { billsApi } from "@/app/services/bills-api";

export function useLineItems(billId: string | null) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    setError(null);
    billsApi
      .getLineItems(billId)
      .then((data) => setLineItems(data.line_items))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to fetch line items";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [billId]);

  return { lineItems, loading, error };
}

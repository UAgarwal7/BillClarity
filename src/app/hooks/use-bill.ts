// useBill — Fetch + poll bill status until completed/failed

import { useState, useEffect, useCallback } from "react";
import type { Bill } from "@/app/types/bill";
import { billsApi } from "@/app/services/bills-api";
import { usePolling } from "./use-polling";

export function useBill(billId: string | null) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBill = useCallback(async (): Promise<Bill | undefined> => {
    if (!billId) return;
    try {
      const data = await billsApi.getBill(billId);
      setBill(data);
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch bill";
      setError(msg);
    }
  }, [billId]);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    setError(null);
    fetchBill().finally(() => setLoading(false));
  }, [billId, fetchBill]);

  const isPolling =
    !!billId &&
    (bill?.parsing_status === "pending" || bill?.parsing_status === "processing");

  usePolling({
    enabled: isPolling,
    intervalMs: 2000,
    onPoll: async () => {
      const data = await fetchBill();
      return data?.parsing_status === "completed" || data?.parsing_status === "failed";
    },
  });

  return { bill, loading, error };
}

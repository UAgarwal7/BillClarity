import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { Bill } from "@/app/types/bill";
import { billsApi } from "@/app/services/bills-api";

interface BillContextValue {
  billId: string | null;
  setBillId: (id: string | null) => void;
  bill: Bill | null;
  billLoading: boolean;
  billError: string | null;
}

const BillContext = createContext<BillContextValue>({
  billId: null,
  setBillId: () => {},
  bill: null,
  billLoading: false,
  billError: null,
});

export function BillProvider({ children }: { children: ReactNode }) {
  const [billId, setBillIdState] = useState<string | null>(() =>
    localStorage.getItem("billclarity_bill_id")
  );
  const [bill, setBill] = useState<Bill | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setBillId = (id: string | null) => {
    if (id) localStorage.setItem("billclarity_bill_id", id);
    else localStorage.removeItem("billclarity_bill_id");
    setBillIdState(id);
    setBill(null);
    setBillError(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchBill = useCallback(async (id: string): Promise<Bill | undefined> => {
    try {
      const data = await billsApi.getBill(id);
      setBill(data);
      return data;
    } catch (e) {
      setBillError(e instanceof Error ? e.message : "Failed to fetch bill");
    }
  }, []);

  // Fetch bill when billId changes
  useEffect(() => {
    if (!billId) {
      setBill(null);
      return;
    }
    setBillLoading(true);
    setBillError(null);
    fetchBill(billId).finally(() => setBillLoading(false));
  }, [billId, fetchBill]);

  // Poll while bill is pending/processing
  useEffect(() => {
    if (!billId || !bill) return;
    const isProcessing =
      bill.parsing_status === "pending" || bill.parsing_status === "processing";
    if (!isProcessing) return;

    pollingRef.current = setInterval(async () => {
      const data = await fetchBill(billId);
      if (data?.parsing_status === "completed" || data?.parsing_status === "failed") {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
      }
    }, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [billId, bill?.parsing_status, fetchBill]);

  return (
    <BillContext.Provider value={{ billId, setBillId, bill, billLoading, billError }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBillContext() {
  return useContext(BillContext);
}

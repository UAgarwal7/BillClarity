// useLineItems — Fetch line items for a bill

import { useState, useEffect } from "react";
import type { LineItem } from "@/app/types/line-item";

export function useLineItems(billId: string | null) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch GET /api/bills/:billId/line-items

  return { lineItems, loading, error };
}

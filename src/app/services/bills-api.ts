// Bills API — /api/bills/* endpoints

import { apiClient } from "./api-client";
import type { Bill } from "@/app/types/bill";
import type { LineItem } from "@/app/types/line-item";

export const billsApi = {
  /** Upload bill files with optional context */
  upload: (formData: FormData) =>
    apiClient.upload<{ bill_id: string; status: string }>("/api/bills/upload", formData),

  /** Get bill metadata and parsing status */
  getBill: (billId: string) =>
    apiClient.get<Bill>(`/api/bills/${billId}`),

  /** Get all extracted line items for a bill */
  getLineItems: (billId: string) =>
    apiClient.get<{ line_items: LineItem[]; total_count: number }>(
      `/api/bills/${billId}/line-items`
    ),

  /** Confirm or correct low-confidence fields */
  confirmFields: (
    billId: string,
    corrections: { line_item_id?: string; field: string; corrected_value: string }[]
  ) =>
    apiClient.post(`/api/bills/${billId}/confirm-fields`, { field_corrections: corrections }),
};

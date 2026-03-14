// Analysis API — /api/bills/:id/explanation, errors, benchmarks, insurance-insights

import { apiClient } from "./api-client";
import type { BenchmarkResult } from "@/app/types/benchmark";

export const analysisApi = {
  /** Get plain-language bill explanation */
  getExplanation: (billId: string) =>
    apiClient.get<{ overall_summary: string; line_item_explanations: { line_item_id: string; explanation: string }[] }>(
      `/api/bills/${billId}/explanation`
    ),

  /** Get detected billing errors */
  getErrors: (billId: string) =>
    apiClient.get<{
      error_summary: { critical: number; warning: number; info: number };
      errors: unknown[];
      cross_document_issues: unknown[];
    }>(`/api/bills/${billId}/errors`),

  /** Get benchmark comparison results */
  getBenchmarks: (billId: string) =>
    apiClient.get<{
      summary: { items_above_typical: number; estimated_savings_low: number; estimated_savings_high: number };
      benchmarks: BenchmarkResult[];
    }>(`/api/bills/${billId}/benchmarks`),

  /** Get insurance rule matching results */
  getInsuranceInsights: (billId: string) =>
    apiClient.get<{ insights: unknown[]; appeal_triggers: unknown[] }>(
      `/api/bills/${billId}/insurance-insights`
    ),
};

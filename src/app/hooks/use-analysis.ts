// useAnalysis — Fetch errors, benchmarks, insights for a bill

import { useState, useEffect } from "react";
import type { ErrorRecord, InsuranceInsight, AppealTrigger } from "@/app/types/analysis";
import type { BenchmarkResult } from "@/app/types/benchmark";

export function useAnalysis(billId: string | null) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [insights, setInsights] = useState<InsuranceInsight[]>([]);
  const [appealTriggers, setAppealTriggers] = useState<AppealTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch all analysis endpoints in parallel
  // TODO: GET /explanation, /errors, /benchmarks, /insurance-insights

  return { explanation, errors, benchmarks, insights, appealTriggers, loading, error };
}

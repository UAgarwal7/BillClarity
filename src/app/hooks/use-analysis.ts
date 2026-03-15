// useAnalysis — Fetch errors, benchmarks, insights for a bill

import { useState, useEffect } from "react";
import type { ErrorRecord, InsuranceInsight, AppealTrigger } from "@/app/types/analysis";
import type { BenchmarkResult, BenchmarkSummary } from "@/app/types/benchmark";
import { analysisApi } from "@/app/services/analysis-api";

export function useAnalysis(billId: string | null) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);
  const [insights, setInsights] = useState<InsuranceInsight[]>([]);
  const [appealTriggers, setAppealTriggers] = useState<AppealTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      analysisApi.getExplanation(billId),
      analysisApi.getErrors(billId),
      analysisApi.getBenchmarks(billId),
      analysisApi.getInsuranceInsights(billId),
    ])
      .then(([expData, errData, benchData, insData]) => {
        setExplanation(expData.overall_summary);
        setErrors(errData.errors as ErrorRecord[]);
        setBenchmarks(benchData.benchmarks);
        setBenchmarkSummary(benchData.summary);
        const insNested = (insData.insights as unknown) as { insights: InsuranceInsight[]; appeal_triggers: AppealTrigger[] } | undefined;
        setInsights(insNested?.insights ?? []);
        setAppealTriggers(insNested?.appeal_triggers ?? []);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load analysis";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [billId]);

  return { explanation, errors, benchmarks, benchmarkSummary, insights, appealTriggers, loading, error };
}

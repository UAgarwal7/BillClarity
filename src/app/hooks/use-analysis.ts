// useAnalysis — Fetch errors, benchmarks, insights for a bill

import { useState, useEffect, useRef } from "react";
import type { ErrorRecord, InsuranceInsight, AppealTrigger } from "@/app/types/analysis";
import type { BenchmarkResult, BenchmarkSummary } from "@/app/types/benchmark";
import { analysisApi } from "@/app/services/analysis-api";

export function useAnalysis(billId: string | null, enabled = true) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);
  const [insights, setInsights] = useState<InsuranceInsight[]>([]);
  const [appealTriggers, setAppealTriggers] = useState<AppealTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!billId || !enabled) return;

    // Reset state for new fetch
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    setBenchmarks([]);
    setBenchmarkSummary(null);
    setErrors([]);
    setExplanation(null);
    setInsights([]);
    setAppealTriggers([]);

    // Fetch each endpoint independently so one failure doesn't block the others
    const settle = <T,>(promise: Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> =>
      promise.then(
        (value) => ({ ok: true as const, value }),
        (error) => ({ ok: false as const, error }),
      );

    Promise.all([
      settle(analysisApi.getExplanation(billId)),
      settle(analysisApi.getErrors(billId)),
      settle(analysisApi.getBenchmarks(billId)),
      settle(analysisApi.getInsuranceInsights(billId)),
    ]).then(([expRes, errRes, benchRes, insRes]) => {
      // Guard against stale responses
      if (fetchId !== fetchIdRef.current) return;

      if (expRes.ok) {
        setExplanation(expRes.value.overall_summary ?? (expRes.value as any).explanation ?? null);
      }
      if (errRes.ok) {
        setErrors(errRes.value.errors as ErrorRecord[]);
      }
      if (benchRes.ok) {
        setBenchmarks(benchRes.value.benchmarks ?? []);
        setBenchmarkSummary(benchRes.value.summary ?? null);
      } else {
        console.error("[Analysis] Failed to fetch benchmarks:", benchRes.error);
      }
      if (insRes.ok) {
        const insNested = (insRes.value.insights as unknown) as { insights: InsuranceInsight[]; appeal_triggers: AppealTrigger[] } | undefined;
        setInsights(insNested?.insights ?? []);
        setAppealTriggers(insNested?.appeal_triggers ?? []);
      }

      // Only set error if ALL requests failed
      const allFailed = !expRes.ok && !errRes.ok && !benchRes.ok && !insRes.ok;
      if (allFailed) {
        const firstErr = [expRes, errRes, benchRes, insRes].find((r) => !r.ok);
        const msg = firstErr && !firstErr.ok && firstErr.error instanceof Error ? firstErr.error.message : "Failed to load analysis";
        setError(msg);
      }

      setLoading(false);
    });
  }, [billId, enabled]);

  return { explanation, errors, benchmarks, benchmarkSummary, insights, appealTriggers, loading, error };
}

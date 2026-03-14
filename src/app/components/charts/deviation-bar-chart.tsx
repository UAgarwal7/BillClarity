// DeviationBarChart — Billed amount vs. typical range + Medicare rate
// Sorted by deviation severity (worst outliers first)

import React from "react";
import type { BenchmarkResult } from "@/app/types/benchmark";

interface DeviationBarChartProps {
  benchmarks: BenchmarkResult[];
}

export function DeviationBarChart({ benchmarks }: DeviationBarChartProps) {
  // TODO: Recharts BarChart with billed amount bars
  // TODO: Reference area for typical low–high range
  // TODO: Reference line for Medicare rate
  // TODO: Sort by deviation_score descending
  return (
    <div className="deviation-bar-chart">
      {/* Recharts BarChart */}
    </div>
  );
}

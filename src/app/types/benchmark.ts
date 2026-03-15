// Benchmark types — BenchmarkResult, DeviationScore, BenchmarkRiskLevel

export type BenchmarkRiskLevel = "normal" | "elevated" | "extreme";

export interface BenchmarkCallResolution {
  status: "resolved" | "adjusted" | "denied";
  previous_amount: number;
  new_amount: number;
  note: string;
  call_id: string;
}

export interface BenchmarkResult {
  _id: string;
  line_item_id: string;
  bill_id: string;
  code: string;
  benchmark_source: string;
  medicare_rate: number;
  typical_low: number;
  typical_median: number;
  typical_high: number;
  billed_amount: number;
  deviation_percentage: number;
  deviation_score: number;
  risk_level: BenchmarkRiskLevel;
  call_resolution?: BenchmarkCallResolution;
}

export interface BenchmarkSummary {
  items_above_typical: number;
  estimated_savings_low: number;
  estimated_savings_high: number;
}

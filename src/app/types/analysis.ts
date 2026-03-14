// Analysis types — ErrorRecord, InsuranceInsight, AppealTrigger

import type { Severity } from "./line-item";

export type ErrorType =
  | "duplicate"
  | "overpriced"
  | "date_mismatch"
  | "denied_billed"
  | "quantity_anomaly"
  | "unbundled"
  | "implausible"
  | "hidden_fee"
  | "unusual_combination"
  | "other";

export interface ErrorRecord {
  line_item_index: number;
  type: ErrorType;
  message: string;
  severity: Severity;
  suggested_action: string;
  affected_amount?: number;
  reasoning?: string;
}

export type InsightStrength = "strong" | "moderate" | "weak";
export type SuccessLikelihood = "high" | "moderate" | "low";

export interface InsuranceInsight {
  rule: string;
  description: string;
  applicability: string;
  strength: InsightStrength;
  appeal_strategy: string;
}

export interface AppealTrigger {
  trigger: string;
  success_likelihood: SuccessLikelihood;
  reasoning: string;
}

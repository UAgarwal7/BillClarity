// LineItem types — LineItem, LineItemFlag, CodeType, Category, RiskLevel

export type CodeType = "CPT" | "HCPCS" | "REV" | "ICD" | null;
export type Category = "facility" | "physician" | "lab" | "imaging" | "procedure" | "medication" | "supply" | "other";
export type RiskLevel = "normal" | "needs_review" | "high_risk";
export type FlagType = "duplicate" | "overpriced" | "date_mismatch" | "denied_billed" | "quantity_anomaly" | "unbundled";
export type Severity = "info" | "warning" | "critical";

export interface LineItemFlag {
  type: FlagType;
  message: string;
  severity: Severity;
  suggested_action: string;
}

export interface CallResolution {
  status: "resolved" | "adjusted" | "denied";
  previous_amount: number;
  new_amount: number;
  note: string;
  call_id: string;
}

export interface LineItem {
  _id: string;
  bill_id: string;
  service_date: string | null;
  description: string;
  code: string | null;
  code_type: CodeType;
  quantity: number;
  billed_amount: number;
  allowed_amount: number | null;
  insurance_paid: number | null;
  patient_responsibility: number | null;
  adjustment_reason: string | null;
  category: Category;
  confidence: number;
  risk_level: RiskLevel;
  flags: LineItemFlag[];
  call_resolution?: CallResolution;
}

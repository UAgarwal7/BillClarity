// Constants — Visit types, error severities, status enums, section keys

export const VISIT_TYPES = [
  { value: "emergency", label: "Emergency" },
  { value: "outpatient", label: "Outpatient" },
  { value: "inpatient", label: "Inpatient" },
  { value: "imaging", label: "Imaging" },
  { value: "other", label: "Other" },
] as const;

export const SEVERITY_LEVELS = ["critical", "warning", "info"] as const;

export const RISK_LEVELS = ["normal", "needs_review", "high_risk"] as const;

export const PARSING_STATUSES = ["pending", "processing", "completed", "failed"] as const;

export const APPEAL_SECTIONS = [
  { key: "bill_explanation", label: "Bill Explanation Report" },
  { key: "flagged_issues", label: "Flagged Issue Summary" },
  { key: "benchmark_analysis", label: "Benchmark Comparison Report" },
  { key: "insurance_insights", label: "Insurance Rule Insights" },
  { key: "appeal_letter", label: "Formal Appeal Letter" },
  { key: "coding_review_request", label: "Coding Review Request" },
  { key: "negotiation_script", label: "Negotiation Script" },
  { key: "evidence_checklist", label: "Evidence Checklist" },
] as const;

export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_FILE_TYPES = [".pdf", ".png", ".jpg", ".jpeg", ".heic"];
export const POLL_INTERVAL_MS = 2000;

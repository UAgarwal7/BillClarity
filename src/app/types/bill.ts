// Bill types — Bill, BillMetadata, ParsingStatus

export type ParsingStatus = "pending" | "processing" | "completed" | "failed";
export type DocumentType = "provider_bill" | "hospital_statement" | "eob" | "denial_letter" | "itemized_statement" | "unknown";
export type VisitType = "emergency" | "outpatient" | "inpatient" | "imaging" | "other";

export interface BillDocument {
  s3_key: string;
  filename: string;
  content_type: string;
  uploaded_at: string;
}

export interface ConfidenceScores {
  overall: number;
  fields: Record<string, number>;
}

export interface Bill {
  _id: string;
  user_id: string;
  provider: string | null;
  facility: string | null;
  visit_type: VisitType;
  service_date_range: { start: string | null; end: string | null };
  total_billed: number | null;
  total_allowed: number | null;
  total_insurance_paid: number | null;
  patient_balance: number | null;
  insurance_provider: string | null;
  document_type: DocumentType;
  documents: BillDocument[];
  parsing_status: ParsingStatus;
  confidence_scores: ConfidenceScores;
  plain_language_summary: string | null;
  user_notes: string | null;
  created_at: string;
  updated_at: string;
}

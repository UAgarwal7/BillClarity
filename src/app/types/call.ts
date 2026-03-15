// Call types — CallSession, TranscriptEntry, CallOutcome

export type CallOutcome = "resolved" | "escalated" | "follow_up" | "unresolved" | null;

export interface TranscriptEntry {
  role: "agent" | "representative" | "system";
  text: string;
  timestamp: string;
  /** Full text for streaming reveals — text is progressively filled while streaming is true */
  fullText?: string;
  streaming?: boolean;
}

export interface AiResponse {
  prompt_context: string;
  response: string;
  timestamp: string;
}

export interface CallSession {
  _id: string;
  bill_id: string;
  started_at: string;
  ended_at: string | null;
  strategy: string;
  initial_script: string;
  transcript: TranscriptEntry[];
  ai_responses: AiResponse[];
  negotiation_outcome: CallOutcome;
  summary: string | null;
  next_steps: string | null;
  notes: string | null;
}

/** Lightweight summary returned by the list endpoint (no transcript/ai_responses). */
export interface CallSummary {
  _id: string;
  bill_id: string;
  started_at: string;
  ended_at: string | null;
  strategy: string;
  initial_script: string;
  negotiation_outcome: CallOutcome;
  summary: string | null;
  next_steps: string | null;
}

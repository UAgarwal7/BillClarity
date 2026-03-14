// useCallSession — Manage call WebSocket lifecycle

import { useState, useRef } from "react";
import type { CallSession, TranscriptEntry } from "@/app/types/call";

export function useCallSession(billId: string | null) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // TODO: startCall() → POST /api/calls/start, then open WS /api/calls/:callId/stream
  // TODO: sendMessage(text) → send transcript segment over WebSocket
  // TODO: endCall() → POST /api/calls/:callId/end, close WS

  const startCall = async () => {};
  const sendMessage = (_text: string) => {};
  const endCall = async () => {};

  return { session, transcript, aiResponse, connected, loading, startCall, sendMessage, endCall };
}

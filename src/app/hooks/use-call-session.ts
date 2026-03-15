// useCallSession — Manage call WebSocket lifecycle

import { useState, useRef } from "react";
import type { CallSession, TranscriptEntry } from "@/app/types/call";
import { callApi } from "@/app/services/call-api";

export function useCallSession(billId: string | null) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const startCall = async () => {
    if (!billId) return;
    setLoading(true);
    try {
      const data = await callApi.start(billId);
      setSession({
        _id: data.call_id,
        bill_id: billId,
        started_at: new Date().toISOString(),
        ended_at: null,
        strategy: data.strategy,
        initial_script: data.opening_script,
        transcript: [],
        ai_responses: [],
        negotiation_outcome: null,
        summary: null,
        next_steps: null,
        notes: null,
      });

      const ws = callApi.createStream(data.call_id);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "transcript") {
            setTranscript((prev) => [...prev, msg.entry as TranscriptEntry]);
          } else if (msg.type === "ai_response") {
            setAiResponse(msg.text as string);
          }
        } catch {
          // ignore malformed messages
        }
      };
    } catch (e) {
      console.error("Failed to start call", e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "transcript", text }));
    }
  };

  const endCall = async () => {
    if (!session) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    try {
      const summary = await callApi.end(session._id);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              ended_at: new Date().toISOString(),
              summary: summary.summary,
              next_steps: summary.next_steps,
              negotiation_outcome: summary.outcome as CallSession["negotiation_outcome"],
            }
          : null
      );
    } catch (e) {
      console.error("Failed to end call", e);
    }
    setConnected(false);
  };

  return { session, transcript, aiResponse, connected, loading, startCall, sendMessage, endCall };
}

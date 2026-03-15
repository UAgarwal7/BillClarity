// useCallSession — Manage call WebSocket lifecycle

import { useState, useRef, useCallback } from "react";
import type { CallSession, TranscriptEntry } from "@/app/types/call";
import { callApi } from "@/app/services/call-api";

export interface DebugLogEntry {
  time: string;
  type: "info" | "send" | "recv" | "error" | "ws";
  message: string;
}

export function useCallSession(billId: string | null) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const log = useCallback((type: DebugLogEntry["type"], message: string) => {
    const entry: DebugLogEntry = {
      time: new Date().toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 1 }),
      type,
      message,
    };
    setDebugLog((prev) => [...prev, entry]);
  }, []);

  const startCall = async () => {
    if (!billId) return;
    setLoading(true);
    setDebugLog([]);

    try {
      // Step 1: Call start API (Gemini generates strategy)
      setLoadingStep("Generating negotiation strategy (Gemini)…");
      log("send", `POST /api/calls/start { bill_id: "${billId}" }`);
      const t0 = Date.now();

      const data = await callApi.start(billId);

      const elapsed = Date.now() - t0;
      log("recv", `200 OK (${elapsed}ms) — call_id: ${data.call_id}`);
      log("info", `Strategy: ${data.strategy.slice(0, 100)}…`);

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

      // Step 2: Open WebSocket
      setLoadingStep("Connecting WebSocket…");
      log("ws", `Opening WebSocket for call ${data.call_id}`);

      const ws = callApi.createStream(data.call_id);
      wsRef.current = ws;

      ws.onopen = () => {
        log("ws", "WebSocket connected");
        setConnected(true);
      };
      ws.onclose = (e) => {
        log("ws", `WebSocket closed (code: ${e.code}, reason: ${e.reason || "none"})`);
        setConnected(false);
      };
      ws.onerror = () => {
        log("error", "WebSocket error");
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          log("recv", `WS message: ${JSON.stringify(msg).slice(0, 200)}`);
          if (msg.type === "ai_response" && msg.response) {
            setAiResponse(msg.response as string);
          } else if (msg.type === "transcript_saved") {
            // Patient message saved — no AI response expected
          } else if (msg.error) {
            log("error", `Server error: ${msg.error} — ${msg.message}`);
          }
        } catch {
          log("error", `Malformed WS message: ${String(event.data).slice(0, 100)}`);
        }
      };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      log("error", `Start call failed: ${errMsg}`);
      console.error("Failed to start call", e);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const sendMessage = (text: string, role: "patient" | "representative" = "patient") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setTranscript((prev) => [
        ...prev,
        { role: role === "patient" ? "agent" : "representative", text, timestamp: new Date().toISOString() },
      ]);
      if (role === "patient") {
        setAiResponse(null);
      }
      const payload = { role, text };
      log("send", `WS send: ${JSON.stringify(payload).slice(0, 200)}`);
      wsRef.current.send(JSON.stringify(payload));
    } else {
      log("error", `Cannot send — WebSocket state: ${wsRef.current?.readyState ?? "null"}`);
    }
  };

  const endCall = async () => {
    if (!session) return;
    log("info", "Ending call…");
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    try {
      log("send", `POST /api/calls/${session._id}/end`);
      const t0 = Date.now();
      const summary = await callApi.end(session._id);
      log("recv", `200 OK (${Date.now() - t0}ms) — outcome: ${summary.outcome}`);

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
      const errMsg = e instanceof Error ? e.message : String(e);
      log("error", `End call failed: ${errMsg}`);
      console.error("Failed to end call", e);
    }
    setConnected(false);
  };

  const reset = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSession(null);
    setTranscript([]);
    setAiResponse(null);
    setConnected(false);
    setLoading(false);
    setLoadingStep(null);
    setDebugLog([]);
  };

  return {
    session,
    transcript,
    aiResponse,
    connected,
    loading,
    loadingStep,
    debugLog,
    startCall,
    sendMessage,
    endCall,
    reset,
  };
}

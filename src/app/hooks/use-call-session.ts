// useCallSession — Voice-based call: Web Speech API (STT) + ElevenLabs (TTS)

import { useState, useRef, useCallback } from "react";
import type { CallSession, TranscriptEntry } from "@/app/types/call";
import { callApi } from "@/app/services/call-api";

export interface DebugLogEntry {
  time: string;
  type: "info" | "send" | "recv" | "error" | "ws" | "audio";
  message: string;
}

const SILENCE_TIMEOUT_MS = 2500;
const WORD_REVEAL_MS = 80;

export function useCallSession(billId: string | null) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLogEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [waitingForAi, setWaitingForAi] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingAutoEndRef = useRef(false);

  const log = useCallback((type: DebugLogEntry["type"], message: string) => {
    const entry: DebugLogEntry = {
      time: new Date().toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 1 }),
      type,
      message,
    };
    setDebugLog((prev) => [...prev, entry]);
  }, []);

  /* ─── Audio playback ─── */

  const playAudio = useCallback((base64Audio: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;
      setAiSpeaking(true);
      audio.onended = () => {
        setAiSpeaking(false);
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        setAiSpeaking(false);
        audioRef.current = null;
        resolve();
      };
      audio.play().catch(() => {
        setAiSpeaking(false);
        audioRef.current = null;
        resolve();
      });
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAiSpeaking(false);
    }
  }, []);

  /* ─── Streaming text reveal ─── */

  const startStreamingText = useCallback((fullText: string, transcriptIndex: number) => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    const words = fullText.split(/\s+/);
    let wordIndex = 0;

    streamIntervalRef.current = setInterval(() => {
      wordIndex++;
      if (wordIndex >= words.length) {
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
        setTranscript((prev) =>
          prev.map((item, i) =>
            i === transcriptIndex ? { ...item, text: fullText, streaming: false } : item
          )
        );
        return;
      }
      const partial = words.slice(0, wordIndex + 1).join(" ");
      setTranscript((prev) =>
        prev.map((item, i) =>
          i === transcriptIndex ? { ...item, text: partial } : item
        )
      );
    }, WORD_REVEAL_MS);
  }, []);

  /* ─── Speech recognition (continuous + silence debounce) ─── */

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      log("error", "Web Speech API not supported in this browser");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let finalTranscript = "";

    const clearSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const commitTranscript = () => {
      clearSilenceTimer();
      const text = finalTranscript.trim();
      if (!text) return;

      log("info", `You said: "${text}"`);
      setTranscript((prev) => [
        ...prev,
        { role: "representative", text, timestamp: new Date().toISOString() },
      ]);
      setListening(false);
      setWaitingForAi(true);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const payload = { role: "representative", text };
        log("send", `WS send: ${JSON.stringify(payload).slice(0, 200)}`);
        wsRef.current.send(JSON.stringify(payload));
      }

      finalTranscript = "";
      try { recognition.stop(); } catch { /* ignore */ }
    };

    recognition.onstart = () => {
      log("audio", "Microphone listening (continuous)…");
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
      }

      clearSilenceTimer();
      if (finalTranscript || interim) {
        silenceTimerRef.current = setTimeout(commitTranscript, SILENCE_TIMEOUT_MS);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        log("error", `Speech recognition error: ${event.error}`);
      }
      setListening(false);
      if (shouldListenRef.current && event.error === "no-speech") {
        setTimeout(() => {
          if (shouldListenRef.current) startListening();
        }, 200);
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (shouldListenRef.current && !waitingForAi) {
        setTimeout(() => {
          if (shouldListenRef.current) startListening();
        }, 200);
      }
    };

    recognition.start();
  }, [log, waitingForAi]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  /* ─── Call lifecycle ─── */

  const endCall = useCallback(async () => {
    if (!session) return;
    log("info", "Ending call…");
    shouldListenRef.current = false;
    stopListening();
    stopAudio();
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

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
    setCallEnded(true);
  }, [session, log, stopListening, stopAudio]);

  const startCall = async () => {
    if (!billId) return;
    setLoading(true);
    setDebugLog([]);
    setCallEnded(false);
    pendingAutoEndRef.current = false;

    try {
      setLoadingStep("Generating negotiation strategy…");
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

      setTranscript([
        { role: "agent", text: data.opening_script, timestamp: new Date().toISOString() },
      ]);

      setLoadingStep("Connecting…");
      log("ws", `Opening WebSocket for call ${data.call_id}`);

      const ws = callApi.createStream(data.call_id);
      wsRef.current = ws;

      ws.onopen = () => {
        log("ws", "WebSocket connected");
        setConnected(true);
      };
      ws.onclose = (e) => {
        log("ws", `WebSocket closed (code: ${e.code})`);
        setConnected(false);
        stopListening();
      };
      ws.onerror = () => {
        log("error", "WebSocket error");
      };
      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          log("recv", `WS: ${JSON.stringify(msg).slice(0, 200)}`);

          if (msg.type === "ai_response" && msg.response) {
            const responseText = msg.response as string;
            setAiResponse(responseText);
            setWaitingForAi(false);

            setTranscript((prev) => {
              const newEntry: TranscriptEntry = {
                role: "agent",
                text: "",
                fullText: responseText,
                streaming: true,
                timestamp: new Date().toISOString(),
              };
              const next = [...prev, newEntry];
              startStreamingText(responseText, next.length - 1);
              return next;
            });

            const shouldAutoEnd = Boolean(msg.end_call);
            if (shouldAutoEnd) {
              pendingAutoEndRef.current = true;
            }

            if (msg.audio_base64) {
              log("audio", "Playing AI response…");
              await playAudio(msg.audio_base64 as string);
            }

            if (pendingAutoEndRef.current) {
              pendingAutoEndRef.current = false;
              log("info", "Auto-ending call (Gemini signaled end_call)");
              await endCall();
              return;
            }

            if (shouldListenRef.current) {
              startListening();
            }
          } else if (msg.type === "transcript_saved") {
            // patient transcript saved — no action needed
          } else if (msg.error) {
            log("error", `Server: ${msg.error} — ${msg.message}`);
            setWaitingForAi(false);
            if (shouldListenRef.current) {
              startListening();
            }
          }
        } catch {
          log("error", `Malformed WS message: ${String(event.data).slice(0, 100)}`);
        }
      };

      if (data.opening_audio_base64) {
        log("audio", "Playing opening statement…");
        setAiSpeaking(true);
        await playAudio(data.opening_audio_base64);
      }

      shouldListenRef.current = true;
      startListening();

    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      log("error", `Start call failed: ${errMsg}`);
      console.error("Failed to start call", e);
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const reset = () => {
    shouldListenRef.current = false;
    pendingAutoEndRef.current = false;
    stopListening();
    stopAudio();
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
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
    setListening(false);
    setAiSpeaking(false);
    setWaitingForAi(false);
    setCallEnded(false);
  };

  return {
    session,
    transcript,
    aiResponse,
    connected,
    loading,
    loadingStep,
    debugLog,
    listening,
    aiSpeaking,
    waitingForAi,
    callEnded,
    startCall,
    endCall,
    reset,
  };
}

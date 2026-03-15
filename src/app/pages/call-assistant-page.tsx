import { useState, useRef, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Pause,
  Play,
  Mic,
  Send,
  Download,
  Clock,
  FileText,
  Loader2,
  Bug,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useCallSession } from "@/app/hooks/use-call-session";
import type { DebugLogEntry } from "@/app/hooks/use-call-session";
import type { TranscriptEntry } from "@/app/types/call";

type CallState = "preparation" | "active" | "completed";

export function CallAssistantPage() {
  const { billId } = useBillContext();
  const {
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
  } = useCallSession(billId);

  const [callState, setCallState] = useState<CallState>("preparation");
  const [isPaused, setIsPaused] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showDebug, setShowDebug] = useState(true);

  const handleStartCall = async () => {
    await startCall();
    setCallState("active");
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    setDurationInterval(interval);
  };

  const handleEndCall = async () => {
    if (durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
    }
    await endCall();
    setCallState("completed");
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!billId) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <p className="text-muted-foreground">No bill loaded. Please upload a bill first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Call Assistant</h1>
        <p className="text-muted-foreground">
          AI-assisted phone negotiation with billing departments.
        </p>
      </div>

      {callState === "preparation" && (
        <CallPreparation
          session={session}
          loading={loading}
          loadingStep={loadingStep}
          onStartCall={handleStartCall}
        />
      )}

      {callState === "active" && (
        <ActiveCall
          transcript={transcript}
          aiResponse={aiResponse}
          duration={formatDuration(callDuration)}
          isPaused={isPaused}
          connected={connected}
          onPause={() => setIsPaused(!isPaused)}
          onSendMessage={sendMessage}
          onEndCall={handleEndCall}
        />
      )}

      {callState === "completed" && (
        <PostCallSummary session={session} transcript={transcript} />
      )}

      {/* Debug Log Panel */}
      {debugLog.length > 0 && (
        <div className="mt-8 border border-border rounded-lg bg-card">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bug className="w-4 h-4" strokeWidth={1.5} />
              Debug Log ({debugLog.length} entries)
            </div>
            {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDebug && <DebugPanel entries={debugLog} />}
        </div>
      )}
    </div>
  );
}

function DebugPanel({ entries }: { entries: DebugLogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const typeColors: Record<string, string> = {
    info: "text-blue-400",
    send: "text-green-400",
    recv: "text-yellow-400",
    error: "text-red-400",
    ws: "text-purple-400",
  };

  return (
    <div
      ref={scrollRef}
      className="max-h-64 overflow-y-auto p-4 pt-0 font-mono text-xs leading-relaxed"
    >
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-muted-foreground shrink-0">{entry.time}</span>
          <span className={`shrink-0 uppercase w-10 ${typeColors[entry.type] ?? "text-muted-foreground"}`}>
            {entry.type}
          </span>
          <span className="text-foreground/80 break-all">{entry.message}</span>
        </div>
      ))}
    </div>
  );
}

function CallPreparation({
  session,
  loading,
  loadingStep,
  onStartCall,
}: {
  session: ReturnType<typeof useCallSession>["session"];
  loading: boolean;
  loadingStep: string | null;
  onStartCall: () => void;
}) {
  return (
    <>
      {session && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl mb-4">Recommended Strategy</h2>
            <div className="p-6 border border-border rounded-lg bg-card">
              <p className="leading-relaxed text-muted-foreground">{session.strategy}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl mb-4">Opening Script</h2>
            <div className="p-6 border border-border rounded-lg bg-card">
              <p className="leading-relaxed text-muted-foreground">{session.initial_script}</p>
            </div>
          </div>
        </>
      )}

      <div className="p-8 border-2 border-border rounded-lg bg-secondary/30 text-center">
        <Phone className="w-12 h-12 mx-auto mb-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl mb-3">Ready to Start?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          The AI assistant will guide the conversation based on your billing analysis and
          recommended strategy.
        </p>
        <button
          onClick={onStartCall}
          disabled={loading}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Phone className="w-5 h-5" strokeWidth={1.5} />
          )}
          {loading ? "Starting…" : "Start AI-Assisted Call"}
        </button>
        {loading && loadingStep && (
          <p className="mt-3 text-sm text-muted-foreground animate-pulse">{loadingStep}</p>
        )}
      </div>
    </>
  );
}

function ActiveCall({
  transcript,
  aiResponse,
  duration,
  isPaused,
  connected,
  onPause,
  onSendMessage,
  onEndCall,
}: {
  transcript: TranscriptEntry[];
  aiResponse: string | null;
  duration: string;
  isPaused: boolean;
  connected: boolean;
  onPause: () => void;
  onSendMessage: (text: string, role?: "patient" | "representative") => void;
  onEndCall: () => void;
}) {
  const [inputText, setInputText] = useState("");
  const [inputRole, setInputRole] = useState<"patient" | "representative">("representative");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), inputRole);
    setInputText("");
  };

  return (
    <>
      {/* Call Status */}
      <div className="mb-6 p-6 border border-primary rounded-lg bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              <span className="font-medium">{connected ? "Call Active" : "Connecting…"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-mono">{duration}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPause}
              className="p-2 border border-border rounded-md hover:bg-secondary transition-colors"
              aria-label={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <Play className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Pause className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={onEndCall}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors inline-flex items-center gap-2"
            >
              <PhoneOff className="w-5 h-5" strokeWidth={1.5} />
              End Call
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Transcript Panel */}
        <div>
          <h2 className="text-2xl mb-4">Live Transcript</h2>
          <div className="border border-border rounded-lg bg-card p-6 h-96 overflow-y-auto">
            {transcript.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Type what the billing representative says below, and the AI will suggest your response.
              </p>
            ) : (
              <div className="space-y-4">
                {transcript.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.role === "agent"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {item.role === "agent" ? "You" : "Representative"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed pl-2 border-l-2 border-border">
                      {item.text}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setInputRole("representative")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  inputRole === "representative"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                Rep said
              </button>
              <button
                onClick={() => setInputRole("patient")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  inputRole === "patient"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                I said
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={inputRole === "representative" ? "Type what the rep said…" : "Type what you said…"}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
              <button
                onClick={handleSend}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors inline-flex items-center gap-1"
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Response Panel */}
        <div>
          <h2 className="text-2xl mb-4">Next AI Response</h2>
          <div className="border border-border rounded-lg bg-card p-6">
            <div className="mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Suggested Response
              </span>
            </div>
            {aiResponse ? (
              <p className="leading-relaxed mb-6">{aiResponse}</p>
            ) : (
              <p className="text-muted-foreground mb-6 text-sm">
                Enter what the representative said to get an AI-suggested response.
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => aiResponse && onSendMessage(aiResponse, "patient")}
                disabled={!aiResponse}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Use This Response
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PostCallSummary({
  session,
  transcript,
}: {
  session: ReturnType<typeof useCallSession>["session"];
  transcript: TranscriptEntry[];
}) {
  return (
    <>
      <div className="mb-8 p-6 border border-border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl mb-2">Call Completed</h2>
            {session?.ended_at && session.started_at && (
              <p className="text-muted-foreground">
                Duration:{" "}
                {Math.round(
                  (new Date(session.ended_at).getTime() -
                    new Date(session.started_at).getTime()) /
                    1000
                )}s
              </p>
            )}
          </div>
          {session?.negotiation_outcome && (
            <div className="px-4 py-2 bg-primary/10 text-primary rounded-md">
              {session.negotiation_outcome}
            </div>
          )}
        </div>
        {session?.summary && (
          <p className="text-muted-foreground leading-relaxed">{session.summary}</p>
        )}
      </div>

      {session?.next_steps && (
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Recommended Next Steps</h2>
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {session.next_steps}
            </p>
          </div>
        </div>
      )}

      {transcript.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Full Conversation Transcript</h2>
          <div className="border border-border rounded-lg bg-card p-6">
            <div className="space-y-4">
              {transcript.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.role === "agent"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.role === "agent" ? "You" : "Representative"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed pl-2 border-l-2 border-border">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-8 border-2 border-border rounded-lg bg-secondary/30 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl mb-3">Export Documentation</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Download an updated appeal packet including call transcript, agreements, and next steps.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            <Download className="w-5 h-5" strokeWidth={1.5} />
            Download Updated Appeal Packet
          </button>
          <button className="px-6 py-3 border border-border rounded-md hover:bg-secondary transition-colors inline-flex items-center gap-2">
            <Download className="w-5 h-5" strokeWidth={1.5} />
            Download Transcript Only
          </button>
        </div>
      </div>
    </>
  );
}

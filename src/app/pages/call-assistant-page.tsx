import { useState, useRef, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Pause,
  Play,
  Send,
  Download,
  Clock,
  FileText,
  Loader2,
  Bug,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useCallSession } from "@/app/hooks/use-call-session";
import type { DebugLogEntry } from "@/app/hooks/use-call-session";
import type { TranscriptEntry, CallSummary, CallSession } from "@/app/types/call";
import { callApi } from "@/app/services/call-api";

type PageView = "history" | "new-call" | "active-call" | "view-call";

export function CallAssistantPage() {
  const { billId } = useBillContext();
  const callSession = useCallSession(billId);

  const [view, setView] = useState<PageView>("history");
  const [pastCalls, setPastCalls] = useState<CallSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallSession | null>(null);
  const [loadingCallDetail, setLoadingCallDetail] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!billId) return;
    setLoadingHistory(true);
    try {
      const data = await callApi.listByBill(billId);
      setPastCalls(data.calls);
    } catch (e) {
      console.error("Failed to load call history", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleViewCall = async (callId: string) => {
    setLoadingCallDetail(true);
    try {
      const data = await callApi.getCallLog(callId);
      setSelectedCall(data);
      setView("view-call");
    } catch (e) {
      console.error("Failed to load call", e);
    } finally {
      setLoadingCallDetail(false);
    }
  };

  const handleNewCall = () => {
    callSession.reset();
    setCallDuration(0);
    setIsPaused(false);
    setView("new-call");
  };

  const handleStartCall = async () => {
    await callSession.startCall();
    setView("active-call");
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    setDurationInterval(interval);
  };

  const handleEndCall = async () => {
    if (durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
    }
    await callSession.endCall();
    await fetchHistory();
  };

  const handleBackToHistory = () => {
    callSession.reset();
    setSelectedCall(null);
    setView("history");
    fetchHistory();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">Call Assistant</h1>
            <p className="text-muted-foreground">
              AI-assisted phone negotiation with billing departments.
            </p>
          </div>
          {view !== "history" && (
            <button
              onClick={handleBackToHistory}
              className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors inline-flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              All Calls
            </button>
          )}
        </div>
      </div>

      {view === "history" && (
        <CallHistory
          calls={pastCalls}
          loading={loadingHistory}
          loadingCallId={loadingCallDetail ? "loading" : null}
          onViewCall={handleViewCall}
          onNewCall={handleNewCall}
        />
      )}

      {view === "new-call" && (
        <CallPreparation
          session={callSession.session}
          loading={callSession.loading}
          loadingStep={callSession.loadingStep}
          onStartCall={handleStartCall}
        />
      )}

      {view === "active-call" && (
        <>
          <ActiveCall
            transcript={callSession.transcript}
            aiResponse={callSession.aiResponse}
            duration={formatDuration(callDuration)}
            isPaused={isPaused}
            connected={callSession.connected}
            onPause={() => setIsPaused(!isPaused)}
            onSendMessage={callSession.sendMessage}
            onEndCall={handleEndCall}
          />
          {callSession.session?.summary && (
            <PostCallSummary
              session={callSession.session}
              transcript={callSession.transcript}
              onBackToHistory={handleBackToHistory}
            />
          )}
        </>
      )}

      {view === "view-call" && selectedCall && (
        <CallDetailView call={selectedCall} onBack={handleBackToHistory} />
      )}

      {callSession.debugLog.length > 0 && (view === "new-call" || view === "active-call") && (
        <div className="mt-8 border border-border rounded-lg bg-card">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bug className="w-4 h-4" strokeWidth={1.5} />
              Debug Log ({callSession.debugLog.length} entries)
            </div>
            {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDebug && <DebugPanel entries={callSession.debugLog} />}
        </div>
      )}
    </div>
  );
}

/* ─── Call History List ─── */

function CallHistory({
  calls,
  loading,
  loadingCallId,
  onViewCall,
  onNewCall,
}: {
  calls: CallSummary[];
  loading: boolean;
  loadingCallId: string | null;
  onViewCall: (id: string) => void;
  onNewCall: () => void;
}) {
  const outcomeConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    resolved: { label: "Resolved", icon: CheckCircle2, className: "text-green-400 bg-green-400/10" },
    escalated: { label: "Escalated", icon: AlertTriangle, className: "text-yellow-400 bg-yellow-400/10" },
    follow_up: { label: "Follow Up", icon: RotateCcw, className: "text-blue-400 bg-blue-400/10" },
    unresolved: { label: "Unresolved", icon: PhoneOff, className: "text-muted-foreground bg-secondary" },
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onNewCall}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={1.5} />
          Start New Call
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : calls.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-border rounded-lg text-center">
          <PhoneCall className="w-12 h-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-xl mb-2">No calls yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start your first AI-assisted call to negotiate your medical bill. The AI will generate a strategy and guide you through the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => {
            const outcome = call.negotiation_outcome
              ? outcomeConfig[call.negotiation_outcome]
              : null;
            const OutcomeIcon = outcome?.icon;
            const started = new Date(call.started_at);
            const duration =
              call.ended_at
                ? Math.round(
                    (new Date(call.ended_at).getTime() - started.getTime()) / 1000
                  )
                : null;

            return (
              <button
                key={call._id}
                onClick={() => onViewCall(call._id)}
                disabled={!!loadingCallId}
                className="w-full text-left p-5 border border-border rounded-lg bg-card hover:bg-secondary/30 transition-colors disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                      <span className="font-medium">
                        {started.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {started.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {duration !== null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" strokeWidth={1.5} />
                          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    {call.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 pl-7">
                        {call.summary}
                      </p>
                    )}
                    {!call.summary && call.strategy && (
                      <p className="text-sm text-muted-foreground line-clamp-2 pl-7">
                        Strategy: {call.strategy}
                      </p>
                    )}
                  </div>
                  {outcome && OutcomeIcon && (
                    <span
                      className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${outcome.className}`}
                    >
                      <OutcomeIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {outcome.label}
                    </span>
                  )}
                  {!call.ended_at && (
                    <span className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-orange-400 bg-orange-400/10">
                      In Progress
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ─── Call Detail View (past call) ─── */

function CallDetailView({ call, onBack }: { call: CallSession; onBack: () => void }) {
  const outcomeLabels: Record<string, string> = {
    resolved: "Resolved",
    escalated: "Escalated",
    follow_up: "Follow Up Needed",
    unresolved: "Unresolved",
  };

  const duration =
    call.ended_at && call.started_at
      ? Math.round(
          (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000
        )
      : null;

  return (
    <>
      {/* Header */}
      <div className="mb-8 p-6 border border-border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl mb-1">
              Call —{" "}
              {new Date(call.started_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {new Date(call.started_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              {duration !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          </div>
          {call.negotiation_outcome && (
            <div className="px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
              {outcomeLabels[call.negotiation_outcome] ?? call.negotiation_outcome}
            </div>
          )}
        </div>
        {call.summary && (
          <p className="text-muted-foreground leading-relaxed">{call.summary}</p>
        )}
      </div>

      {/* Strategy */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Strategy Used</h2>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="leading-relaxed text-muted-foreground">{call.strategy}</p>
        </div>
      </div>

      {/* Next Steps */}
      {call.next_steps && (
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Recommended Next Steps</h2>
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {call.next_steps}
            </p>
          </div>
        </div>
      )}

      {/* Transcript */}
      {call.transcript && call.transcript.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Full Transcript</h2>
          <div className="border border-border rounded-lg bg-card p-6">
            <div className="space-y-4">
              {call.transcript.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.role === "agent" || item.role === "patient"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.role === "agent" || item.role === "patient" ? "You" : "Representative"}
                    </span>
                    {item.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    )}
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

      {/* Back */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-border rounded-md hover:bg-secondary transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          Back to All Calls
        </button>
      </div>
    </>
  );
}

/* ─── Debug Panel ─── */

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

/* ─── Call Preparation (new call) ─── */

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

/* ─── Active Call ─── */

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

/* ─── Post-Call Summary (inline after ending) ─── */

function PostCallSummary({
  session,
  transcript,
  onBackToHistory,
}: {
  session: ReturnType<typeof useCallSession>["session"];
  transcript: TranscriptEntry[];
  onBackToHistory: () => void;
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

      <div className="flex gap-4 justify-center">
        <button
          onClick={onBackToHistory}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          Back to All Calls
        </button>
      </div>
    </>
  );
}

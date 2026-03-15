import { useState, useRef, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Clock,
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
  Mic,
  Volume2,
} from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useCallSession } from "@/app/hooks/use-call-session";
import type { DebugLogEntry } from "@/app/hooks/use-call-session";
import type { TranscriptEntry, CallSummary, CallSession } from "@/app/types/call";
import { callApi } from "@/app/services/call-api";

type PageView = "history" | "active-call" | "view-call";

export function CallAssistantPage() {
  const { billId, refreshBill } = useBillContext();
  const callSession = useCallSession(billId);

  const [view, setView] = useState<PageView>("history");
  const [pastCalls, setPastCalls] = useState<CallSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallSession | null>(null);
  const [loadingCallDetail, setLoadingCallDetail] = useState(false);

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

  const handleStartCall = async () => {
    callSession.reset();
    setCallDuration(0);
    setView("active-call");
    await callSession.startCall();
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
    await refreshBill();
  };

  useEffect(() => {
    if (callSession.callEnded && durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
      fetchHistory();
      refreshBill();
    }
  }, [callSession.callEnded, durationInterval, fetchHistory, refreshBill]);

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
              AI-powered voice negotiation with billing departments.
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
          onNewCall={handleStartCall}
          startingCall={callSession.loading}
        />
      )}

      {view === "active-call" && (
        <>
          <VoiceCall
            transcript={callSession.transcript}
            duration={formatDuration(callDuration)}
            connected={callSession.connected}
            listening={callSession.listening}
            aiSpeaking={callSession.aiSpeaking}
            waitingForAi={callSession.waitingForAi}
            loading={callSession.loading}
            loadingStep={callSession.loadingStep}
            callEnded={callSession.callEnded}
            onEndCall={handleEndCall}
            onNewCall={handleStartCall}
            onBackToHistory={handleBackToHistory}
          />
          {callSession.session?.summary && (
            <PostCallSummary
              session={callSession.session}
              transcript={callSession.transcript}
              onBackToHistory={handleBackToHistory}
              onNewCall={handleStartCall}
            />
          )}
        </>
      )}

      {view === "view-call" && selectedCall && (
        <CallDetailView call={selectedCall} onBack={handleBackToHistory} />
      )}

      {callSession.debugLog.length > 0 && view === "active-call" && (
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

/* ─── Voice Call (active) ─── */

function VoiceCall({
  transcript,
  duration,
  connected,
  listening,
  aiSpeaking,
  waitingForAi,
  loading,
  loadingStep,
  callEnded,
  onEndCall,
  onNewCall,
  onBackToHistory,
}: {
  transcript: TranscriptEntry[];
  duration: string;
  connected: boolean;
  listening: boolean;
  aiSpeaking: boolean;
  waitingForAi: boolean;
  loading: boolean;
  loadingStep: string | null;
  callEnded: boolean;
  onEndCall: () => void;
  onNewCall: () => void;
  onBackToHistory: () => void;
}) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const statusText = callEnded
    ? "Call Ended"
    : loading
      ? (loadingStep || "Starting call…")
      : aiSpeaking
        ? "Patient is speaking…"
        : waitingForAi
          ? "Generating response…"
          : listening
            ? "Listening to you (insurance rep)…"
            : connected
              ? "Connected"
              : "Connecting…";

  const statusColor = callEnded
    ? "text-muted-foreground"
    : aiSpeaking
      ? "text-blue-400"
      : listening
        ? "text-green-400"
        : waitingForAi
          ? "text-yellow-400"
          : "text-muted-foreground";

  return (
    <>
      {/* Call status bar */}
      <div className={`mb-6 p-6 border rounded-lg ${callEnded ? "border-border bg-card" : "border-primary bg-primary/5"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {callEnded ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={1.5} />
              ) : loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" strokeWidth={1.5} />
              ) : aiSpeaking ? (
                <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" strokeWidth={1.5} />
              ) : listening ? (
                <Mic className="w-5 h-5 text-green-400 animate-pulse" strokeWidth={1.5} />
              ) : waitingForAi ? (
                <Loader2 className="w-5 h-5 animate-spin text-yellow-400" strokeWidth={1.5} />
              ) : (
                <div className={`w-3 h-3 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              )}
              <span className={`font-medium text-sm ${statusColor}`}>{statusText}</span>
            </div>
            {!loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-sm font-mono">{duration}</span>
              </div>
            )}
          </div>
          {callEnded ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onNewCall}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2 text-sm"
              >
                <Phone className="w-4 h-4" strokeWidth={1.5} />
                Call Again
              </button>
              <button
                onClick={onBackToHistory}
                className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors inline-flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                All Calls
              </button>
            </div>
          ) : (
            <button
              onClick={onEndCall}
              disabled={loading}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <PhoneOff className="w-5 h-5" strokeWidth={1.5} />
              End Call
            </button>
          )}
        </div>
      </div>

      {/* Visual indicator */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              callEnded
                ? "bg-green-500/10 ring-2 ring-green-500/30"
                : aiSpeaking
                  ? "bg-blue-500/20 ring-4 ring-blue-500/30"
                  : listening
                    ? "bg-green-500/20 ring-4 ring-green-500/30"
                    : waitingForAi
                      ? "bg-yellow-500/10 ring-2 ring-yellow-500/20"
                      : "bg-secondary ring-2 ring-border"
            }`}
          >
            {callEnded ? (
              <CheckCircle2 className="w-12 h-12 text-green-400" strokeWidth={1.5} />
            ) : aiSpeaking ? (
              <Volume2 className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
            ) : listening ? (
              <Mic className="w-12 h-12 text-green-400" strokeWidth={1.5} />
            ) : waitingForAi ? (
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" strokeWidth={1.5} />
            ) : loading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={1.5} />
            ) : (
              <Phone className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
          {!callEnded && (aiSpeaking || listening) && (
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${aiSpeaking ? "bg-blue-500" : "bg-green-500"}`} />
          )}
        </div>
      </div>

      {/* Role labels */}
      <div className="mb-4 flex justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-muted-foreground">Patient (AI)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-muted-foreground">Insurance Rep (You)</span>
        </div>
      </div>

      {/* Live transcript */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-medium">Live Transcript</h2>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {transcript.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {loading ? "Setting up the call…" : "Conversation will appear here…"}
            </p>
          ) : (
            <div className="space-y-4">
              {transcript.map((item, index) => {
                const isPatient = item.role === "agent" || item.role === "patient";
                return (
                  <div key={index} className={`flex ${isPatient ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] ${isPatient ? "pr-8" : "pl-8"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isPatient ? "bg-blue-400" : "bg-green-400"}`} />
                        <span className="text-xs text-muted-foreground">
                          {isPatient ? "Patient (AI)" : "Insurance Rep (You)"}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${
                          isPatient
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "bg-green-500/10 border border-green-500/20"
                        }`}
                      >
                        {item.text}
                        {item.streaming && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-400 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Call History List ─── */

function CallHistory({
  calls,
  loading,
  loadingCallId,
  onViewCall,
  onNewCall,
  startingCall,
}: {
  calls: CallSummary[];
  loading: boolean;
  loadingCallId: string | null;
  onViewCall: (id: string) => void;
  onNewCall: () => void;
  startingCall: boolean;
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
          disabled={startingCall}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          {startingCall ? (
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
          ) : (
            <Plus className="w-5 h-5" strokeWidth={1.5} />
          )}
          {startingCall ? "Starting Call…" : "Start New Call"}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          You play the insurance rep. The AI speaks as the patient via voice.
        </p>
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
            Start a voice call to hear the AI negotiate your medical bill as the patient. You'll play the role of the insurance representative.
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

      {call.strategy && (
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Strategy Used</h2>
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="leading-relaxed text-muted-foreground">{call.strategy}</p>
          </div>
        </div>
      )}

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

      {call.transcript && call.transcript.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Full Transcript</h2>
          <div className="border border-border rounded-lg bg-card p-6">
            <div className="space-y-4">
              {call.transcript.map((item, index) => {
                const isPatient = item.role === "agent" || item.role === "patient";
                return (
                  <div key={index} className={`flex ${isPatient ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] ${isPatient ? "pr-8" : "pl-8"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isPatient ? "bg-blue-400" : "bg-green-400"}`} />
                        <span className="text-xs text-muted-foreground">
                          {isPatient ? "Patient (AI)" : "Insurance Rep"}
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
                      <div
                        className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${
                          isPatient
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "bg-green-500/10 border border-green-500/20"
                        }`}
                      >
                        {item.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

/* ─── Post-Call Summary ─── */

function PostCallSummary({
  session,
  transcript,
  onBackToHistory,
  onNewCall,
}: {
  session: ReturnType<typeof useCallSession>["session"];
  transcript: TranscriptEntry[];
  onBackToHistory: () => void;
  onNewCall: () => void;
}) {
  return (
    <div className="mt-8">
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

      <div className="flex gap-4 justify-center">
        <button
          onClick={onNewCall}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <Phone className="w-5 h-5" strokeWidth={1.5} />
          Start New Call
        </button>
        <button
          onClick={onBackToHistory}
          className="px-6 py-3 border border-border rounded-md hover:bg-secondary transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          Back to All Calls
        </button>
      </div>
    </div>
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
    audio: "text-cyan-400",
  };

  return (
    <div
      ref={scrollRef}
      className="max-h-64 overflow-y-auto p-4 pt-0 font-mono text-xs leading-relaxed"
    >
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-muted-foreground shrink-0">{entry.time}</span>
          <span className={`shrink-0 uppercase w-12 ${typeColors[entry.type] ?? "text-muted-foreground"}`}>
            {entry.type}
          </span>
          <span className="text-foreground/80 break-all">{entry.message}</span>
        </div>
      ))}
    </div>
  );
}

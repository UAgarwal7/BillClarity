import { useState } from "react";
import { Phone, PhoneOff, Pause, Play, Mic, Download, Clock, CheckCircle, FileText } from "lucide-react";

type CallState = "preparation" | "active" | "completed";

interface ConversationItem {
  speaker: "representative" | "ai";
  text: string;
  timestamp: string;
}

export function CallAssistantPage() {
  const [callState, setCallState] = useState<CallState>("preparation");
  const [callDuration, setCallDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);

  // Mock data for call preparation
  const billingIssue = {
    summary: "Disputing $3,550 in overcharges across 3 line items including a Chest X-Ray charged at $2,400 (typical range: $150-300) and potential duplicate IV administration charges.",
    appealStrategy: "Focus on benchmarking data for X-Ray overcharge, request itemized breakdown for IV charges, and cite No Surprises Act protections for out-of-network radiology services.",
    keyEvidence: [
      "Regional pricing data showing 700% overcharge on chest X-ray",
      "Possible duplicate billing for IV administration",
      "Out-of-network balance billing protections under federal law",
      "Medical necessity documentation for preventive lab work"
    ]
  };

  const negotiationScript = [
    {
      step: "Opening",
      text: "Hello, I'm calling regarding account number [XXXXX] for services on [DATE]. I've reviewed the bill and identified several charges I'd like to discuss."
    },
    {
      step: "State Issue",
      text: "Specifically, I'm concerned about the $2,400 charge for a chest X-ray, which is significantly above the typical regional range of $150-300."
    },
    {
      step: "Request Action",
      text: "I'd like to request a detailed review of this charge and adjustment to fair market value based on Medicare and regional pricing data."
    },
    {
      step: "Listen & Respond",
      text: "I understand. Can you provide documentation on how this charge was calculated?"
    }
  ];

  // Mock conversation data for active call
  const mockConversation: ConversationItem[] = [
    {
      speaker: "ai",
      text: "Hello, I'm calling regarding account number 12345 for services received on March 1st. I've reviewed the bill and identified several charges I'd like to discuss.",
      timestamp: "0:05"
    },
    {
      speaker: "representative",
      text: "Thank you for calling. Let me pull up your account. Can you tell me which specific charges you're concerned about?",
      timestamp: "0:18"
    },
    {
      speaker: "ai",
      text: "Yes, I'm concerned about the $2,400 charge for a chest X-ray with code 71046. This appears to be significantly above the typical regional range of $150 to $300.",
      timestamp: "0:32"
    },
    {
      speaker: "representative",
      text: "I see that charge here. Our facility fees can vary based on the type of equipment and radiologist availability. Let me check if there are any adjustments we can make.",
      timestamp: "0:45"
    }
  ];

  const handleStartCall = () => {
    setCallState("active");
    setConversation(mockConversation);
  };

  const handleEndCall = () => {
    setCallState("completed");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Call Assistant</h1>
        <p className="text-muted-foreground">
          AI-assisted phone negotiation with billing departments.
        </p>
      </div>

      {callState === "preparation" && (
        <CallPreparation 
          billingIssue={billingIssue}
          negotiationScript={negotiationScript}
          onStartCall={handleStartCall}
        />
      )}

      {callState === "active" && (
        <ActiveCall
          conversation={conversation}
          duration={callDuration}
          isPaused={isPaused}
          onPause={() => setIsPaused(!isPaused)}
          onEndCall={handleEndCall}
        />
      )}

      {callState === "completed" && (
        <PostCallSummary conversation={conversation} />
      )}
    </div>
  );
}

function CallPreparation({ 
  billingIssue, 
  negotiationScript, 
  onStartCall 
}: { 
  billingIssue: any; 
  negotiationScript: any[];
  onStartCall: () => void;
}) {
  return (
    <>
      {/* Billing Issue Summary */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Billing Issue Summary</h2>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="leading-relaxed text-muted-foreground">{billingIssue.summary}</p>
        </div>
      </div>

      {/* Appeal Strategy */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Recommended Appeal Strategy</h2>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="leading-relaxed text-muted-foreground">{billingIssue.appealStrategy}</p>
        </div>
      </div>

      {/* Key Evidence Points */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Key Evidence Points</h2>
        <div className="space-y-3">
          {billingIssue.keyEvidence.map((evidence: string, index: number) => (
            <div key={index} className="p-4 border border-border rounded-lg bg-card flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-muted-foreground">{evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Negotiation Script */}
      <div className="mb-12">
        <h2 className="text-2xl mb-4">Negotiation Script</h2>
        <div className="space-y-4">
          {negotiationScript.map((item, index) => (
            <div key={index} className="p-6 border border-border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-secondary rounded-full text-sm text-muted-foreground">
                  Step {index + 1}
                </span>
                <h3>{item.step}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Start Call Button */}
      <div className="p-8 border-2 border-border rounded-lg bg-secondary/30 text-center">
        <Phone className="w-12 h-12 mx-auto mb-4 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl mb-3">Ready to Start?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          The AI assistant will guide the conversation based on your billing analysis and recommended strategy. You can pause at any time to speak directly.
        </p>
        <button 
          onClick={onStartCall}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <Phone className="w-5 h-5" strokeWidth={1.5} />
          Start AI-Assisted Call
        </button>
      </div>
    </>
  );
}

function ActiveCall({ 
  conversation, 
  duration, 
  isPaused,
  onPause,
  onEndCall 
}: {
  conversation: ConversationItem[];
  duration: number;
  isPaused: boolean;
  onPause: () => void;
  onEndCall: () => void;
}) {
  const nextAiResponse = "I understand your facility's pricing structure. However, I have benchmarking data showing regional averages significantly lower. Would you be able to review this with your billing supervisor?";

  return (
    <>
      {/* Call Status */}
      <div className="mb-6 p-6 border border-primary rounded-lg bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="font-medium">Call Active</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-mono">2:47</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onPause}
              className="p-2 border border-border rounded-md hover:bg-secondary transition-colors"
              aria-label={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="w-5 h-5" strokeWidth={1.5} /> : <Pause className="w-5 h-5" strokeWidth={1.5} />}
            </button>
            <button 
              className="p-2 border border-border rounded-md hover:bg-secondary transition-colors"
              aria-label="Speak"
            >
              <Mic className="w-5 h-5" strokeWidth={1.5} />
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
            <div className="space-y-4">
              {conversation.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.speaker === "ai" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {item.speaker === "ai" ? "AI Assistant" : "Representative"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{item.timestamp}</span>
                  </div>
                  <p className="text-sm leading-relaxed pl-2 border-l-2 border-border">
                    {item.text}
                  </p>
                </div>
              ))}
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
            <p className="leading-relaxed mb-6">{nextAiResponse}</p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Use This Response
              </button>
              <button className="w-full px-4 py-2.5 border border-border rounded-md hover:bg-secondary transition-colors">
                Modify Response
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 p-4 border border-border rounded-lg bg-secondary/30">
            <h3 className="mb-3">Quick Actions</h3>
            <div className="space-y-2 text-sm">
              <button className="w-full text-left px-3 py-2 hover:bg-background rounded transition-colors">
                Request supervisor
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-background rounded transition-colors">
                Ask for itemized breakdown
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-background rounded transition-colors">
                Reference benchmarking data
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-background rounded transition-colors">
                Cite insurance protections
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Progress */}
      <div>
        <h2 className="text-2xl mb-4">Negotiation Progress</h2>
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="space-y-4">
            <NegotiationStep 
              completed
              title="Issue Stated"
              description="Clearly communicated overcharge concerns"
            />
            <NegotiationStep 
              completed
              title="Evidence Presented"
              description="Referenced benchmarking data for X-ray charges"
            />
            <NegotiationStep 
              active
              title="Representative Response"
              description="Awaiting explanation of pricing structure"
            />
            <NegotiationStep 
              title="Request Adjustment"
              description="Pending - will request supervisor review"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function NegotiationStep({ 
  completed, 
  active, 
  title, 
  description 
}: { 
  completed?: boolean;
  active?: boolean;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          completed ? "bg-primary border-primary" :
          active ? "border-primary bg-primary/10" :
          "border-border bg-background"
        }`}>
          {completed && <CheckCircle className="w-4 h-4 text-primary-foreground" strokeWidth={2} />}
          {active && <div className="w-2 h-2 bg-primary rounded-full" />}
        </div>
        <div className={`w-0.5 h-8 ${completed || active ? "bg-primary" : "bg-border"}`} />
      </div>
      <div className="flex-1 pb-4">
        <h4 className="mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PostCallSummary({ conversation }: { conversation: ConversationItem[] }) {
  const callSummary = {
    duration: "2:47",
    outcome: "Partial agreement reached",
    agreements: [
      "X-ray charge will be reviewed by billing supervisor within 3 business days",
      "Itemized breakdown of IV charges will be sent via email",
      "Follow-up call scheduled for March 18th to discuss adjustments"
    ],
    nextSteps: [
      "Wait for itemized breakdown email (expected within 2 days)",
      "Review supervisor's X-ray pricing justification",
      "Prepare additional documentation for follow-up call",
      "Consider formal appeal if adjustment offer is insufficient"
    ]
  };

  return (
    <>
      {/* Call Summary Header */}
      <div className="mb-8 p-6 border border-border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl mb-2">Call Completed</h2>
            <p className="text-muted-foreground">Call duration: {callSummary.duration}</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-md">
            {callSummary.outcome}
          </div>
        </div>
      </div>

      {/* Detected Agreements */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Detected Agreements</h2>
        <div className="space-y-3">
          {callSummary.agreements.map((agreement, index) => (
            <div key={index} className="p-4 border border-border rounded-lg bg-card flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-muted-foreground">{agreement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Recommended Next Steps</h2>
        <div className="space-y-3">
          {callSummary.nextSteps.map((step, index) => (
            <div key={index} className="p-4 border border-border rounded-lg bg-card flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm text-muted-foreground">
                {index + 1}
              </span>
              <p className="text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Conversation Transcript */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Full Conversation Transcript</h2>
        <div className="border border-border rounded-lg bg-card p-6">
          <div className="space-y-4">
            {conversation.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.speaker === "ai" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {item.speaker === "ai" ? "AI Assistant" : "Representative"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{item.timestamp}</span>
                </div>
                <p className="text-sm leading-relaxed pl-2 border-l-2 border-border">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Actions */}
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

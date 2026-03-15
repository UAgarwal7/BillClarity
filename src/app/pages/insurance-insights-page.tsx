import { FileText, AlertCircle, Loader2 } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useAnalysis } from "@/app/hooks/use-analysis";
import type { InsuranceInsight, AppealTrigger } from "@/app/types/analysis";

export function InsuranceInsightsPage() {
  const { billId, bill, billLoading } = useBillContext();
  const isProcessing =
    bill?.parsing_status === "pending" || bill?.parsing_status === "processing";
  const { insights, appealTriggers, loading, error } = useAnalysis(
    billId,
    !isProcessing && !!bill
  );

  if (!billId) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <p className="text-muted-foreground">No bill loaded. Please upload a bill first.</p>
      </div>
    );
  }

  if (billLoading || isProcessing) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Insurance Insights</h1>
          <p className="text-muted-foreground">
            Detected insurance-related issues, coverage opportunities, and potential appeal strategies.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Your bill is being processed. Insurance insights will appear here once analysis is complete.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-muted-foreground">Loading insights...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Insurance Insights</h1>
        <p className="text-muted-foreground">
          Detected insurance-related issues, coverage opportunities, and potential appeal strategies.
        </p>
      </div>

      {insights.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl mb-6">Coverage & Policy Insights</h2>
          <div className="space-y-6">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {appealTriggers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl mb-6">Appeal Opportunities</h2>
          <div className="space-y-6">
            {appealTriggers.map((trigger, index) => (
              <AppealTriggerCard key={index} trigger={trigger} />
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && appealTriggers.length === 0 && (
        <p className="text-muted-foreground">No insights available yet.</p>
      )}

      {(insights.length > 0 || appealTriggers.length > 0) && (
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-6 border border-border rounded-lg bg-card text-center">
            <p className="text-3xl mb-2">{insights.filter((i) => i.strength === "strong").length}</p>
            <p className="text-sm text-muted-foreground">Strong Insights</p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card text-center">
            <p className="text-3xl mb-2">{appealTriggers.filter((t) => t.success_likelihood === "high").length}</p>
            <p className="text-sm text-muted-foreground">High-Likelihood Appeals</p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card text-center">
            <p className="text-3xl mb-2">{appealTriggers.length}</p>
            <p className="text-sm text-muted-foreground">Total Appeal Triggers</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: InsuranceInsight }) {
  const strengthStyles: Record<string, string> = {
    strong: "bg-destructive/10 text-destructive border border-destructive/20",
    moderate: "bg-primary/10 text-primary border border-primary/20",
    weak: "bg-secondary text-muted-foreground",
  };

  return (
    <div className="p-6 border border-border rounded-lg bg-card">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <AlertCircle className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3>{insight.rule}</h3>
            <span className={`px-3 py-1 rounded-full text-xs ${strengthStyles[insight.strength] ?? ""}`}>
              {insight.strength}
            </span>
          </div>
          <p className="text-muted-foreground mb-4 leading-relaxed">{insight.description}</p>
          <div className="p-4 bg-secondary/50 rounded-md border-l-2 border-primary">
            <p className="text-sm">
              <strong className="text-foreground">Strategy:</strong>{" "}
              <span className="text-muted-foreground">{insight.appeal_strategy}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppealTriggerCard({ trigger }: { trigger: AppealTrigger }) {
  const likelihoodStyles: Record<string, string> = {
    high: "bg-destructive/10 text-destructive border border-destructive/20",
    moderate: "bg-primary/10 text-primary border border-primary/20",
    low: "bg-secondary text-muted-foreground",
  };

  return (
    <div className="p-6 border border-border rounded-lg bg-card">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <FileText className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3>{trigger.trigger}</h3>
            <span className={`px-3 py-1 rounded-full text-xs ${likelihoodStyles[trigger.success_likelihood] ?? ""}`}>
              {trigger.success_likelihood} success
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{trigger.reasoning}</p>
        </div>
      </div>
    </div>
  );
}

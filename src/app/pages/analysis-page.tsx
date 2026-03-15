import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useLineItems } from "@/app/hooks/use-line-items";
import type { RiskLevel } from "@/app/types/line-item";

type DisplayRisk = "Normal" | "Review" | "High Risk";

function toDisplayRisk(risk: RiskLevel): DisplayRisk {
  if (risk === "normal") return "Normal";
  if (risk === "needs_review") return "Review";
  return "High Risk";
}

export function AnalysisPage() {
  const { billId, bill, billLoading } = useBillContext();
  const isProcessing =
    bill?.parsing_status === "pending" || bill?.parsing_status === "processing";
  const { lineItems, loading, error } = useLineItems(billId);

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
          <h1 className="text-3xl mb-2">Bill Analysis</h1>
          <p className="text-muted-foreground">
            Detailed analysis of line items with potential issues flagged for review.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Your bill is being processed. Line item analysis will appear here once complete.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-muted-foreground">Loading analysis...</span>
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

  const normalCount = lineItems.filter((i) => i.risk_level === "normal").length;
  const reviewCount = lineItems.filter((i) => i.risk_level === "needs_review").length;
  const highRiskCount = lineItems.filter((i) => i.risk_level === "high_risk").length;

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Bill Analysis</h1>
        <p className="text-muted-foreground">
          Detailed analysis of line items with potential issues flagged for review.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Normal</span>
          </div>
          <p className="text-3xl">{normalCount}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Review</span>
          </div>
          <p className="text-3xl">{reviewCount}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">High Risk</span>
          </div>
          <p className="text-3xl">{highRiskCount}</p>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <h2 className="text-2xl mb-6">Line Items</h2>
        {lineItems.length === 0 ? (
          <p className="text-muted-foreground">No line items found.</p>
        ) : (
          <div className="space-y-4">
            {lineItems.map((item) => {
              const displayRisk = toDisplayRisk(item.risk_level);
              const flagNote = item.flags[0]?.message ?? "";
              return (
                <div key={item._id} className="p-6 border border-border rounded-lg bg-card">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3>{item.description}</h3>
                        <RiskBadge risk={displayRisk} />
                      </div>
                      {item.code && (
                        <p className="text-sm text-muted-foreground">
                          Code: {item.code}{item.code_type ? ` (${item.code_type})` : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">${item.billed_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  {flagNote && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{flagNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: DisplayRisk }) {
  const styles: Record<DisplayRisk, string> = {
    Normal: "bg-secondary text-muted-foreground",
    Review: "bg-muted text-foreground",
    "High Risk": "bg-destructive/10 text-destructive border border-destructive/20",
  };

  const icons: Record<DisplayRisk, React.ReactNode> = {
    Normal: <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />,
    Review: <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />,
    "High Risk": <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${styles[risk]}`}>
      {icons[risk]}
      {risk}
    </span>
  );
}

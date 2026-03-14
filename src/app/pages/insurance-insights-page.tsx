import { FileText, AlertCircle, CheckCircle } from "lucide-react";

interface Insight {
  type: "denial" | "appeal" | "coverage";
  title: string;
  description: string;
  recommendation: string;
}

export function InsuranceInsightsPage() {
  const insights: Insight[] = [
    {
      type: "coverage",
      title: "Preventive Lab Work Coverage",
      description: "Comprehensive Metabolic Panel may qualify as preventive care under ACA guidelines when ordered during an annual wellness visit.",
      recommendation: "Request medical necessity documentation from your provider. This test may be fully covered if linked to preventive screening."
    },
    {
      type: "denial",
      title: "Possible Coding Mismatch",
      description: "Emergency Physician Services coded as Level 5 (99285) but documentation may not support highest complexity level.",
      recommendation: "Request medical records and compare against CMS documentation guidelines for Level 5 emergency visits. If documentation doesn't support this level, request a coding review."
    },
    {
      type: "appeal",
      title: "Out-of-Network Balance Billing",
      description: "Radiologist services may have been out-of-network despite visiting an in-network emergency room.",
      recommendation: "Under the No Surprises Act, you may be protected from balance billing for emergency services. File an appeal citing federal balance billing protections."
    },
    {
      type: "coverage",
      title: "Potential Duplicate Charge",
      description: "IV Administration and IV Push charges appear on the same date of service. These may represent duplicate billing for the same procedure.",
      recommendation: "Request itemized bill with timestamps. If both charges occurred simultaneously, one may be bundled and should be removed."
    },
    {
      type: "appeal",
      title: "Facility Fee Appropriateness",
      description: "Emergency room facility fees vary significantly between hospitals. Your charge is at the higher end of the regional range.",
      recommendation: "While facility fees are often legitimate, request an explanation of how the fee was calculated and compare against published hospital chargemaster rates."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Insurance Insights</h1>
        <p className="text-muted-foreground">
          Detected insurance-related issues, coverage opportunities, and potential appeal strategies.
        </p>
      </div>

      {/* Insights Grid */}
      <div className="space-y-6">
        {insights.map((insight, index) => (
          <div key={index} className="p-6 border border-border rounded-lg bg-card">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <InsightIcon type={insight.type} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3>{insight.title}</h3>
                  <InsightBadge type={insight.type} />
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {insight.description}
                </p>
                <div className="p-4 bg-secondary/50 rounded-md border-l-2 border-primary">
                  <p className="text-sm">
                    <strong className="text-foreground">Recommendation:</strong>{" "}
                    <span className="text-muted-foreground">{insight.recommendation}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Summary */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="p-6 border border-border rounded-lg bg-card text-center">
          <p className="text-3xl mb-2">
            {insights.filter(i => i.type === "denial").length}
          </p>
          <p className="text-sm text-muted-foreground">Potential Denials</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card text-center">
          <p className="text-3xl mb-2">
            {insights.filter(i => i.type === "appeal").length}
          </p>
          <p className="text-sm text-muted-foreground">Appeal Opportunities</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card text-center">
          <p className="text-3xl mb-2">
            {insights.filter(i => i.type === "coverage").length}
          </p>
          <p className="text-sm text-muted-foreground">Coverage Issues</p>
        </div>
      </div>
    </div>
  );
}

function InsightIcon({ type }: { type: Insight["type"] }) {
  const icons = {
    denial: <AlertCircle className="w-6 h-6 text-destructive" strokeWidth={1.5} />,
    appeal: <FileText className="w-6 h-6 text-primary" strokeWidth={1.5} />,
    coverage: <CheckCircle className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
  };

  return icons[type];
}

function InsightBadge({ type }: { type: Insight["type"] }) {
  const styles = {
    denial: "bg-destructive/10 text-destructive border border-destructive/20",
    appeal: "bg-primary/10 text-primary border border-primary/20",
    coverage: "bg-secondary text-muted-foreground"
  };

  const labels = {
    denial: "Denial Risk",
    appeal: "Appeal Strategy",
    coverage: "Coverage"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

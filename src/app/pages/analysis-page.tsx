import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

type RiskLevel = "Normal" | "Review" | "High Risk";

interface LineItem {
  service: string;
  code: string;
  cost: number;
  risk: RiskLevel;
  note: string;
}

export function AnalysisPage() {
  const lineItems: LineItem[] = [
    {
      service: "Emergency Room Visit - Level 4",
      code: "99284",
      cost: 3200.00,
      risk: "Normal",
      note: "Standard ER visit coding for moderate complexity."
    },
    {
      service: "Complete Blood Count (CBC)",
      code: "85025",
      cost: 285.00,
      risk: "Normal",
      note: "Common lab test, pricing within normal range."
    },
    {
      service: "Chest X-Ray, 2 Views",
      code: "71046",
      cost: 2400.00,
      risk: "High Risk",
      note: "Price significantly exceeds regional average of $150-300."
    },
    {
      service: "Comprehensive Metabolic Panel",
      code: "80053",
      cost: 215.00,
      risk: "Normal",
      note: "Standard metabolic panel pricing."
    },
    {
      service: "Emergency Physician Services",
      code: "99285",
      cost: 2800.00,
      risk: "Review",
      note: "High complexity coding. Verify this matches actual service level."
    },
    {
      service: "IV Administration",
      code: "96374",
      cost: 850.00,
      risk: "Review",
      note: "Price higher than typical range of $200-500."
    },
    {
      service: "Acetaminophen 650mg",
      code: "J0129",
      cost: 125.00,
      risk: "High Risk",
      note: "Over-the-counter medication charged at hospital markup."
    },
  ];

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
          <p className="text-3xl">
            {lineItems.filter(item => item.risk === "Normal").length}
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Review</span>
          </div>
          <p className="text-3xl">
            {lineItems.filter(item => item.risk === "Review").length}
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">High Risk</span>
          </div>
          <p className="text-3xl">
            {lineItems.filter(item => item.risk === "High Risk").length}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <h2 className="text-2xl mb-6">Line Items</h2>
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={index} className="p-6 border border-border rounded-lg bg-card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3>{item.service}</h3>
                    <RiskBadge risk={item.risk} />
                  </div>
                  <p className="text-sm text-muted-foreground">Code: {item.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-lg">${item.cost.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles = {
    "Normal": "bg-secondary text-muted-foreground",
    "Review": "bg-muted text-foreground",
    "High Risk": "bg-destructive/10 text-destructive border border-destructive/20"
  };

  const icons = {
    "Normal": <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />,
    "Review": <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />,
    "High Risk": <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${styles[risk]}`}>
      {icons[risk]}
      {risk}
    </span>
  );
}

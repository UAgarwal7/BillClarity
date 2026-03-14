import { FileText, Download, Printer, Mail } from "lucide-react";

interface Document {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function AppealPacketPage() {
  const documents: Document[] = [
    {
      title: "Appeal Letter",
      description: "Formal letter outlining disputed charges and requesting review, including specific line items and supporting documentation references.",
      icon: <Mail className="w-6 h-6" strokeWidth={1.5} />
    },
    {
      title: "Bill Analysis Report",
      description: "Detailed breakdown of all charges with benchmarking data, coding analysis, and flagged discrepancies highlighted for review.",
      icon: <FileText className="w-6 h-6" strokeWidth={1.5} />
    },
    {
      title: "Negotiation Script",
      description: "Step-by-step conversation guide for speaking with billing departments, including key talking points and negotiation strategies.",
      icon: <FileText className="w-6 h-6" strokeWidth={1.5} />
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Appeal Packet</h1>
        <p className="text-muted-foreground">
          Generated documents to support your medical bill dispute or negotiation.
        </p>
      </div>

      {/* Documents */}
      <div className="space-y-6 mb-12">
        {documents.map((doc, index) => (
          <div key={index} className="p-6 border border-border rounded-lg bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary rounded-lg text-primary">
                {doc.icon}
              </div>
              <div className="flex-1">
                <h3 className="mb-2">{doc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {doc.description}
                </p>
                <div className="flex gap-3">
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors">
                    <Download className="w-4 h-4" strokeWidth={1.5} />
                    Download PDF
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors">
                    <Printer className="w-4 h-4" strokeWidth={1.5} />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export All */}
      <div className="p-8 border-2 border-border rounded-lg bg-secondary/30 text-center">
        <h2 className="text-2xl mb-3">Complete Dispute Packet</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Download all documents as a single packet ready to submit to your healthcare provider or insurance company.
        </p>
        <button className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
          <Download className="w-5 h-5" strokeWidth={1.5} />
          Export Dispute Packet
        </button>
      </div>

      {/* Sample Preview */}
      <div className="mt-12">
        <h2 className="text-2xl mb-6">Sample Appeal Letter Preview</h2>
        <div className="p-8 border border-border rounded-lg bg-card">
          <div className="space-y-6 text-sm leading-relaxed max-w-3xl">
            <div>
              <p className="text-muted-foreground">[Your Name]</p>
              <p className="text-muted-foreground">[Your Address]</p>
              <p className="text-muted-foreground">[Date]</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">[Healthcare Provider/Insurance Company]</p>
              <p className="text-muted-foreground">Billing Department</p>
              <p className="text-muted-foreground">[Address]</p>
            </div>

            <div>
              <p className="mb-4"><strong>Re: Dispute of Medical Bill - Account #[XXXXX]</strong></p>
              <p className="mb-4 text-muted-foreground">Dear Billing Department,</p>
              <p className="mb-4 text-muted-foreground">
                I am writing to formally dispute certain charges on my medical bill dated [DATE] for services received on [DATE OF SERVICE]. After careful review and comparison with standard medical billing practices, I have identified the following concerns:
              </p>
            </div>

            <div className="pl-6 border-l-2 border-primary space-y-3">
              <div>
                <p className="font-medium">1. Chest X-Ray Overcharge</p>
                <p className="text-muted-foreground">
                  Charge: $2,400.00 | Typical Range: $150-300
                </p>
                <p className="text-muted-foreground">
                  This charge exceeds regional averages by approximately 700%. I request a detailed explanation and adjustment to fair market value.
                </p>
              </div>
              
              <div>
                <p className="font-medium">2. Potential Duplicate Billing</p>
                <p className="text-muted-foreground">
                  IV Administration charges may duplicate bundled emergency services already billed under code 99284.
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-4">
                Enclosed please find supporting documentation including benchmarking data and detailed analysis. I respectfully request a comprehensive review of these charges and an itemized explanation of the billing.
              </p>
              <p className="text-muted-foreground mb-4">
                I am committed to paying all legitimate charges and request your assistance in resolving these discrepancies within 30 days.
              </p>
              <p className="text-muted-foreground">Sincerely,</p>
              <p className="text-muted-foreground">[Your Name]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { FileText, AlertCircle, CheckCircle, Download, Mail, Loader2 } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useAppealPacket } from "@/app/hooks/use-appeal-packet";
import { MarkdownContent } from "@/app/components/ui/markdown-content";
import { appealApi } from "@/app/services/appeal-api";

const DEFAULT_SECTIONS = ["bill_explanation", "flagged_issues", "benchmark_analysis", "insurance_insights", "appeal_letter", "negotiation_script"];

const SECTION_META: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  bill_explanation: {
    title: "Bill Explanation",
    description: "Simplified breakdown of your medical bill in plain language, explaining what you were charged for.",
    icon: <FileText className="w-6 h-6" strokeWidth={1.5} />,
  },
  flagged_issues: {
    title: "Flagged Billing Issues",
    description: "Specific discrepancies, duplicate charges, or coding errors identified in your bill.",
    icon: <AlertCircle className="w-6 h-6" strokeWidth={1.5} />,
  },
  benchmark_analysis: {
    title: "Benchmark Price Comparison",
    description: "Comparison of your bill's prices against Medicare rates and typical market medians.",
    icon: <FileText className="w-6 h-6" strokeWidth={1.5} />,
  },
  insurance_insights: {
    title: "Insurance Insights",
    description: "Coverage opportunities and potential appeal triggers based on insurance rules.",
    icon: <CheckCircle className="w-6 h-6" strokeWidth={1.5} />,
  },
  appeal_letter: {
    title: "Appeal Letter",
    description:
      "Formal letter outlining disputed charges and requesting review, including specific line items and supporting documentation references.",
    icon: <Mail className="w-6 h-6" strokeWidth={1.5} />,
  },
  negotiation_script: {
    title: "Negotiation Script",
    description:
      "Step-by-step conversation guide for speaking with billing departments, including key talking points and negotiation strategies.",
    icon: <FileText className="w-6 h-6" strokeWidth={1.5} />,
  },
};

export function AppealPacketPage() {
  const { billId } = useBillContext();
  const { packet, loading, initialLoading, generating, error, generate, exportPdf } = useAppealPacket(billId);
  const [downloadingSection, setDownloadingSection] = useState<string | null>(null);

  const handleDownloadSection = async (sectionKey: string) => {
    if (!packet) return;
    setDownloadingSection(sectionKey);
    try {
      const blob = await appealApi.getSectionPdf(packet._id, sectionKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sectionKey.replace(/_/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: download as text
      const content = packet.sections[sectionKey];
      if (content) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sectionKey.replace(/_/g, "-")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloadingSection(null);
    }
  };

  if (!billId) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <p className="text-muted-foreground">No bill loaded. Please upload a bill first.</p>
      </div>
    );
  }

  const handleGenerate = () => generate(DEFAULT_SECTIONS);

  if (initialLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-muted-foreground">Loading appeal packet...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Appeal Packet</h1>
        <p className="text-muted-foreground">
          Generated documents to support your medical bill dispute or negotiation.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      {!packet && !generating && (
        <div className="mb-12 p-8 border-2 border-dashed border-border rounded-lg text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-xl mb-3">Generate Your Appeal Packet</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We'll create a personalized appeal letter, bill analysis report, and negotiation script
            based on your specific bill.
          </p>
          <button
            onClick={handleGenerate}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Generate Packet
          </button>
        </div>
      )}

      {generating && (
        <div className="mb-12 p-8 border border-border rounded-lg flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Generating your appeal packet…</span>
        </div>
      )}

      {packet && (
        <>
          {/* Export All — at the top */}
          <div className="mb-12 p-8 border-2 border-border rounded-lg bg-secondary/30 text-center">
            <h2 className="text-2xl mb-3">Complete Dispute Packet</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Download all documents as a single packet ready to submit to your healthcare provider
              or insurance company.
            </p>
            <button
              onClick={exportPdf}
              disabled={loading}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" strokeWidth={1.5} />
              )}
              Export Dispute Packet
            </button>
          </div>

          {/* Individual Sections */}
          <div className="space-y-6">
            {DEFAULT_SECTIONS.map((key) => {
              const meta = SECTION_META[key];
              const content = packet.sections[key];
              if (!meta) return null;
              return (
                <div key={key} className="p-6 border border-border rounded-lg bg-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-lg text-primary">{meta.icon}</div>
                    <div className="flex-1">
                      <h3 className="mb-2">{meta.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {meta.description}
                      </p>
                      {content && (
                        <div className="mb-4 p-4 bg-secondary/30 rounded-md text-sm max-h-48 overflow-y-auto">
                          <MarkdownContent>{content}</MarkdownContent>
                        </div>
                      )}
                      {content && (
                        <button
                          onClick={() => handleDownloadSection(key)}
                          disabled={downloadingSection === key}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          {downloadingSection === key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" strokeWidth={1.5} />
                          )}
                          Download Section
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

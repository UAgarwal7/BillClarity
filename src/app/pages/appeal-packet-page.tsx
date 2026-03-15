import { useState } from "react";
import { FileText, AlertCircle, CheckCircle, Download, Mail, Loader2, PhoneCall, RefreshCw } from "lucide-react";
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
  const { billId, bill } = useBillContext();
  const { packet, loading, initialLoading, generating, error, generate, exportPdf } = useAppealPacket(billId);
  const [downloadingSection, setDownloadingSection] = useState<string | null>(null);
  const hasCallUpdates = Boolean(bill?.call_adjustments);

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

  if (initialLoading || generating) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Appeal Packet</h1>
          <p className="text-muted-foreground">
            Generated documents to support your medical bill dispute or negotiation.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {initialLoading ? "Loading appeal packet..." : "Generating your appeal packet — this may take a moment..."}
          </p>
        </div>
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

      {!packet && (
        <p className="text-muted-foreground">No appeal packet available yet.</p>
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

          {/* Regenerate banner after call updates */}
          {hasCallUpdates && (
            <div className="mb-6 p-4 border border-green-500/30 rounded-lg bg-green-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">
                  Call outcomes may have changed some sections. Regenerate to update.
                </span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 text-sm border border-green-500/30 rounded-md hover:bg-green-500/10 transition-colors inline-flex items-center gap-2 text-green-400 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                )}
                Regenerate
              </button>
            </div>
          )}

          {/* Individual Sections */}
          <div className="space-y-6">
            {DEFAULT_SECTIONS.map((key) => {
              const meta = SECTION_META[key];
              const content = packet.sections[key];
              if (!meta) return null;
              const affectedByCall = hasCallUpdates && ["flagged_issues", "benchmark_analysis", "insurance_insights", "appeal_letter", "negotiation_script"].includes(key);
              return (
                <div key={key} className={`p-6 border rounded-lg bg-card ${affectedByCall ? "border-green-500/20" : "border-border"}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-lg text-primary">{meta.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3>{meta.title}</h3>
                        {affectedByCall && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                            <PhoneCall className="w-3 h-3" strokeWidth={2} />
                            Updated after call
                          </span>
                        )}
                      </div>
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

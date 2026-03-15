import { Loader2, PhoneCall } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useBill } from "@/app/hooks/use-bill";
import { MarkdownContent } from "@/app/components/ui/markdown-content";

export function BillOverviewPage() {
  const { billId } = useBillContext();
  const { bill, loading, error } = useBill(billId);

  if (!billId) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <p className="text-muted-foreground">No bill loaded. Please upload a bill first.</p>
      </div>
    );
  }

  if (loading && !bill) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-muted-foreground">Loading bill...</span>
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

  const isProcessing =
    bill?.parsing_status === "pending" || bill?.parsing_status === "processing";

  if (isProcessing) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-6" />
          <h1 className="text-2xl mb-3">Analyzing Your Bill</h1>
          <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
            We're extracting line items, detecting errors, benchmarking charges, and checking insurance rules. This usually takes 30–60 seconds.
          </p>
          <div className="space-y-3 w-full max-w-sm">
            <ProcessingStep label="Extracting text & tables" status="active" />
            <ProcessingStep label="Identifying line items & codes" status="pending" />
            <ProcessingStep label="Benchmarking against fair prices" status="pending" />
            <ProcessingStep label="Detecting billing errors" status="pending" />
            <ProcessingStep label="Checking insurance coverage" status="pending" />
          </div>
          <p className="text-xs text-muted-foreground mt-8">
            This page will update automatically when processing completes.
          </p>
        </div>
      </div>
    );
  }

  const totalBilled = bill?.total_billed ?? 0;
  const insurancePaid = bill?.total_insurance_paid ?? 0;
  const patientResponsibility = bill?.patient_balance ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Bill Overview</h1>
        <p className="text-muted-foreground">
          Summary of your medical bill charges and payment breakdown.
        </p>
        {bill && (
          <p className="text-xs text-muted-foreground mt-1">
            {bill.provider ?? "Unknown provider"} · {bill.facility ?? "Unknown facility"}
            {bill.service_date_range?.start && (
              <> · {new Date(bill.service_date_range.start).toLocaleDateString()}</>
            )}
          </p>
        )}
      </div>

      {bill?.plain_language_summary && (
        <div className="mb-8 p-6 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-medium mb-2">Summary</h2>
          <MarkdownContent>{bill.plain_language_summary}</MarkdownContent>
        </div>
      )}

      {/* Call Adjustment Banner */}
      {bill?.call_adjustments && (
        <div className="mb-8 p-6 border border-green-500/30 rounded-lg bg-green-500/5">
          <div className="flex items-center gap-3 mb-3">
            <PhoneCall className="w-5 h-5 text-green-400" strokeWidth={1.5} />
            <h2 className="text-lg font-medium text-green-400">Updated After Call</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{bill.call_adjustments.savings_summary}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Billed</p>
              <p className="text-sm">
                <span className="line-through text-muted-foreground">${bill.call_adjustments.previous_total_billed.toLocaleString()}</span>
                {" → "}
                <span className="text-green-400 font-medium">${bill.call_adjustments.new_total_billed.toLocaleString()}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Your Responsibility</p>
              <p className="text-sm">
                <span className="line-through text-muted-foreground">${bill.call_adjustments.previous_patient_balance.toLocaleString()}</span>
                {" → "}
                <span className="text-green-400 font-medium">${bill.call_adjustments.new_patient_balance.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Bill Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Total Billed</p>
          {bill?.call_adjustments ? (
            <>
              <p className="text-xl line-through text-muted-foreground">${totalBilled.toLocaleString()}</p>
              <p className="text-3xl text-green-400">${bill.call_adjustments.new_total_billed.toLocaleString()}</p>
            </>
          ) : (
            <p className="text-3xl">${totalBilled.toLocaleString()}</p>
          )}
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Insurance Paid</p>
          <p className="text-3xl">${insurancePaid.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Your Responsibility</p>
          {bill?.call_adjustments ? (
            <>
              <p className="text-xl line-through text-muted-foreground">${patientResponsibility.toLocaleString()}</p>
              <p className="text-3xl text-green-400">${bill.call_adjustments.new_patient_balance.toLocaleString()}</p>
            </>
          ) : (
            <p className="text-3xl">${patientResponsibility.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Payment Flow */}
      <div>
        <h2 className="text-2xl mb-6">Payment Flow</h2>
        <div className="p-8 border border-border rounded-lg bg-card">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-muted-foreground">Total Billed</div>
              <div className="flex-1 h-12 bg-secondary rounded flex items-center px-4">
                {bill?.call_adjustments ? (
                  <>
                    <span className="line-through text-muted-foreground mr-3">${totalBilled.toLocaleString()}</span>
                    <span className="text-green-400 font-medium">${bill.call_adjustments.new_total_billed.toLocaleString()}</span>
                  </>
                ) : (
                  <>${totalBilled.toLocaleString()}</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-muted-foreground">Insurance</div>
              <div className="flex-1 h-12 bg-primary/20 border border-primary rounded flex items-center px-4">
                -${insurancePaid.toLocaleString()}
              </div>
            </div>
            <div className="border-t border-border pt-6 flex items-center gap-4">
              <div className="w-32 text-sm font-medium">You Pay</div>
              <div className="flex-1 h-12 bg-accent border border-border rounded flex items-center px-4 font-medium">
                {bill?.call_adjustments ? (
                  <>
                    <span className="line-through text-muted-foreground mr-3">${patientResponsibility.toLocaleString()}</span>
                    <span className="text-green-400">${bill.call_adjustments.new_patient_balance.toLocaleString()}</span>
                  </>
                ) : (
                  <>${patientResponsibility.toLocaleString()}</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingStep({ label, status }: { label: string; status: "active" | "pending" }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {status === "active" ? (
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-border shrink-0" />
      )}
      <span className={status === "active" ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

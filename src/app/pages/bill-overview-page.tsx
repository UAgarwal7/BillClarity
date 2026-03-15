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

  const totalBilled = bill?.total_billed ?? 0;
  const insurancePaid = bill?.total_insurance_paid ?? 0;
  const patientResponsibility = bill?.patient_balance ?? 0;
  const isProcessing =
    bill?.parsing_status === "pending" || bill?.parsing_status === "processing";

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

      {isProcessing && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-secondary/30 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            AWS is still processing your documents. Data will update automatically.
          </span>
        </div>
      )}

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

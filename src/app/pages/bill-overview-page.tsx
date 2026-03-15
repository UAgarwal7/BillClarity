import { Loader2 } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useBill } from "@/app/hooks/use-bill";

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
            {bill.service_date_range.start && (
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
          <p className="text-muted-foreground leading-relaxed">{bill.plain_language_summary}</p>
        </div>
      )}

      {/* Total Bill Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Total Billed</p>
          <p className="text-3xl">${totalBilled.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Insurance Paid</p>
          <p className="text-3xl">${insurancePaid.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Your Responsibility</p>
          <p className="text-3xl">${patientResponsibility.toLocaleString()}</p>
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
                ${totalBilled.toLocaleString()}
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
                ${patientResponsibility.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

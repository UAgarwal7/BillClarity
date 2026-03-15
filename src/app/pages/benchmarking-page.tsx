import { Loader2, PhoneCall } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useAnalysis } from "@/app/hooks/use-analysis";

export function BenchmarkingPage() {
  const { billId, bill, billLoading } = useBillContext();
  const isProcessing =
    bill?.parsing_status === "pending" || bill?.parsing_status === "processing";
  const { benchmarks, benchmarkSummary, loading, error } = useAnalysis(
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
          <h1 className="text-3xl mb-2">Cost Benchmarking</h1>
          <p className="text-muted-foreground">
            Comparison of your charges against typical regional and national pricing.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Your bill is being processed. Benchmarking data will appear here once analysis is complete.
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
        <span className="text-muted-foreground">Loading benchmarks...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Cost Benchmarking</h1>
        <p className="text-muted-foreground">
          Comparison of your charges against typical regional and national pricing.
        </p>
      </div>

      {benchmarkSummary && (
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground mb-2">Items Above Typical</p>
            <p className="text-3xl">{benchmarkSummary.items_above_typical}</p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground mb-2">Est. Savings (Low)</p>
            <p className="text-3xl">${benchmarkSummary.estimated_savings_low.toLocaleString()}</p>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground mb-2">Est. Savings (High)</p>
            <p className="text-3xl">${benchmarkSummary.estimated_savings_high.toLocaleString()}</p>
          </div>
        </div>
      )}

      {benchmarks.length === 0 ? (
        <p className="text-muted-foreground">No benchmark data available yet.</p>
      ) : (
        <div className="space-y-6">
          {benchmarks.map((item) => {
            const totalSpan = Math.max(item.billed_amount, item.typical_high) - item.typical_low;
            const minPosition = 0;
            const maxPosition = totalSpan > 0
              ? ((item.typical_high - item.typical_low) / totalSpan) * 100
              : 100;
            const chargePosition = totalSpan > 0
              ? Math.min(((item.billed_amount - item.typical_low) / totalSpan) * 100, 100)
              : 50;

            const isAboveRange = item.billed_amount > item.typical_high;
            const isBelowRange = item.billed_amount < item.typical_low;
            const isInRange = !isAboveRange && !isBelowRange;
            const deviation = isAboveRange ? item.billed_amount - item.typical_high : 0;

            const cr = item.call_resolution;
            const isResolved = cr?.status === "resolved";
            const isAdjusted = cr?.status === "adjusted";

            return (
              <div key={item._id} className={`p-6 border rounded-lg bg-card ${isResolved ? "border-green-500/30 opacity-60" : "border-border"}`}>
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className={isResolved ? "line-through" : ""}>{item.code}</h3>
                      {isResolved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                          <PhoneCall className="w-3 h-3" strokeWidth={2} />
                          Resolved
                        </span>
                      )}
                      {isAdjusted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <PhoneCall className="w-3 h-3" strokeWidth={2} />
                          Adjusted
                        </span>
                      )}
                    </div>
                    {deviation > 0 && !isResolved && (
                      <span className="px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20">
                        ${deviation.toLocaleString()} above range
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-4 text-sm">
                    <span className="text-muted-foreground">Your charge:</span>
                    {isAdjusted && cr ? (
                      <>
                        <span className="font-medium text-lg line-through text-muted-foreground">${cr.previous_amount.toLocaleString()}</span>
                        <span className="font-medium text-lg text-green-400">${cr.new_amount.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className={`font-medium text-lg ${isResolved ? "line-through text-muted-foreground" : ""}`}>${item.billed_amount.toLocaleString()}</span>
                    )}
                    <span className="text-xs text-muted-foreground">Source: {item.benchmark_source}</span>
                  </div>
                  {cr?.note && (
                    <p className="text-sm text-green-400/80 mt-2">{cr.note}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="relative h-12 bg-secondary rounded">
                    <div
                      className="absolute h-full bg-primary/20 border-l-2 border-r-2 border-primary"
                      style={{ left: `${minPosition}%`, width: `${maxPosition}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-foreground"
                      style={{ left: `${chargePosition}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground" />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div>
                      <div className="mb-1">Typical Range</div>
                      <div className="font-medium text-foreground">
                        ${item.typical_low.toLocaleString()} – ${item.typical_high.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1">Status</div>
                      <div className={`font-medium ${isInRange ? "text-foreground" : "text-destructive"}`}>
                        {isInRange && "Within Range"}
                        {isAboveRange && "Above Range"}
                        {isBelowRange && "Below Range"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 p-6 border border-border rounded-lg bg-secondary/30">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Note:</strong> Benchmarking data is based on regional
          averages from Medicare, private insurance claims, and facility cost reports. Actual
          appropriate pricing may vary based on geographic location, facility type, and complexity
          of service.
        </p>
      </div>
    </div>
  );
}

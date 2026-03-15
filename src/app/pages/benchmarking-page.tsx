import { Loader2 } from "lucide-react";
import { useBillContext } from "@/app/context/bill-context";
import { useAnalysis } from "@/app/hooks/use-analysis";

export function BenchmarkingPage() {
  const { billId } = useBillContext();
  const { benchmarks, benchmarkSummary, loading, error } = useAnalysis(billId);

  if (!billId) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <p className="text-muted-foreground">No bill loaded. Please upload a bill first.</p>
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

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          {error}
        </div>
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

            return (
              <div key={item._id} className="p-6 border border-border rounded-lg bg-card">
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3>{item.code}</h3>
                    {deviation > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20">
                        ${deviation.toLocaleString()} above range
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-4 text-sm">
                    <span className="text-muted-foreground">Your charge:</span>
                    <span className="font-medium text-lg">${item.billed_amount.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Source: {item.benchmark_source}</span>
                  </div>
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

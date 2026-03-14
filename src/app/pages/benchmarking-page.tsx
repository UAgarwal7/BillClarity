interface BenchmarkItem {
  service: string;
  yourCharge: number;
  typicalMin: number;
  typicalMax: number;
  deviation: number;
}

export function BenchmarkingPage() {
  const benchmarks: BenchmarkItem[] = [
    {
      service: "Emergency Room Visit - Level 4",
      yourCharge: 3200,
      typicalMin: 2000,
      typicalMax: 3500,
      deviation: 0
    },
    {
      service: "Complete Blood Count (CBC)",
      yourCharge: 285,
      typicalMin: 150,
      typicalMax: 300,
      deviation: 0
    },
    {
      service: "Chest X-Ray, 2 Views",
      yourCharge: 2400,
      typicalMin: 150,
      typicalMax: 300,
      deviation: 700
    },
    {
      service: "Comprehensive Metabolic Panel",
      yourCharge: 215,
      typicalMin: 180,
      typicalMax: 250,
      deviation: 0
    },
    {
      service: "Emergency Physician Services",
      yourCharge: 2800,
      typicalMin: 1500,
      typicalMax: 2500,
      deviation: 300
    },
    {
      service: "IV Administration",
      yourCharge: 850,
      typicalMin: 200,
      typicalMax: 500,
      deviation: 350
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Cost Benchmarking</h1>
        <p className="text-muted-foreground">
          Comparison of your charges against typical regional and national pricing.
        </p>
      </div>

      <div className="space-y-6">
        {benchmarks.map((item, index) => {
          const rangeSpan = item.typicalMax - item.typicalMin;
          const totalSpan = Math.max(item.yourCharge, item.typicalMax) - item.typicalMin;
          const minPosition = 0;
          const maxPosition = ((item.typicalMax - item.typicalMin) / totalSpan) * 100;
          const chargePosition = ((item.yourCharge - item.typicalMin) / totalSpan) * 100;
          
          const isAboveRange = item.yourCharge > item.typicalMax;
          const isBelowRange = item.yourCharge < item.typicalMin;
          const isInRange = !isAboveRange && !isBelowRange;

          return (
            <div key={index} className="p-6 border border-border rounded-lg bg-card">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3>{item.service}</h3>
                  {item.deviation > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20">
                      ${item.deviation} above range
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-4 text-sm">
                  <span className="text-muted-foreground">Your charge:</span>
                  <span className="font-medium text-lg">${item.yourCharge.toLocaleString()}</span>
                </div>
              </div>

              {/* Visual Comparison */}
              <div className="space-y-3">
                <div className="relative h-12 bg-secondary rounded">
                  {/* Typical Range Bar */}
                  <div 
                    className="absolute h-full bg-primary/20 border-l-2 border-r-2 border-primary"
                    style={{
                      left: `${minPosition}%`,
                      width: `${maxPosition}%`
                    }}
                  />
                  
                  {/* Your Charge Marker */}
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
                      ${item.typicalMin.toLocaleString()} - ${item.typicalMax.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1">Status</div>
                    <div className={`font-medium ${
                      isInRange ? 'text-foreground' : 'text-destructive'
                    }`}>
                      {isInRange && 'Within Range'}
                      {isAboveRange && 'Above Range'}
                      {isBelowRange && 'Below Range'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Note */}
      <div className="mt-12 p-6 border border-border rounded-lg bg-secondary/30">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Note:</strong> Benchmarking data is based on regional averages from Medicare, private insurance claims, and facility cost reports. Actual appropriate pricing may vary based on geographic location, facility type, and complexity of service.
        </p>
      </div>
    </div>
  );
}

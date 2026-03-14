export function BillOverviewPage() {
  const billData = {
    totalBilled: 12450.00,
    insurancePaid: 8200.00,
    patientResponsibility: 4250.00,
    categories: [
      { name: "Emergency Room Visit", amount: 3200.00 },
      { name: "Lab Tests", amount: 1850.00 },
      { name: "Radiology (X-Ray)", amount: 2400.00 },
      { name: "Physician Services", amount: 2800.00 },
      { name: "Medications", amount: 1200.00 },
      { name: "Medical Supplies", amount: 1000.00 },
    ]
  };

  const maxAmount = Math.max(...billData.categories.map(c => c.amount));

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Bill Overview</h1>
        <p className="text-muted-foreground">
          Summary of your medical bill charges and payment breakdown.
        </p>
      </div>

      {/* Total Bill Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Total Billed</p>
          <p className="text-3xl">${billData.totalBilled.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Insurance Paid</p>
          <p className="text-3xl">${billData.insurancePaid.toLocaleString()}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Your Responsibility</p>
          <p className="text-3xl">${billData.patientResponsibility.toLocaleString()}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-8">
        <h2 className="text-2xl mb-6">Category Breakdown</h2>
        <div className="space-y-4">
          {billData.categories.map((category, index) => {
            const percentage = (category.amount / maxAmount) * 100;
            
            return (
              <div key={index} className="p-6 border border-border rounded-lg bg-card">
                <div className="flex justify-between items-start mb-3">
                  <h3>{category.name}</h3>
                  <span className="font-medium">${category.amount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
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
                ${billData.totalBilled.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-muted-foreground">Insurance</div>
              <div className="flex-1 h-12 bg-primary/20 border border-primary rounded flex items-center px-4">
                -${billData.insurancePaid.toLocaleString()}
              </div>
            </div>
            <div className="border-t border-border pt-6 flex items-center gap-4">
              <div className="w-32 text-sm font-medium">You Pay</div>
              <div className="flex-1 h-12 bg-accent border border-border rounded flex items-center px-4 font-medium">
                ${billData.patientResponsibility.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

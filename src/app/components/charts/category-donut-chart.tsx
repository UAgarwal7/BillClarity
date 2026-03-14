// CategoryDonutChart — Charge breakdown by category (Recharts PieChart)
// Categories: facility, physician, lab, imaging, procedure, medication, supply, other

import React from "react";
import type { LineItem } from "@/app/types/line-item";

interface CategoryDonutChartProps {
  lineItems: LineItem[];
}

export function CategoryDonutChart({ lineItems }: CategoryDonutChartProps) {
  // TODO: Aggregate billed amounts by category
  // TODO: Recharts PieChart with inner radius (donut)
  // TODO: Custom tooltip showing $ amount + percentage
  // TODO: Legend with category colors
  return (
    <div className="category-donut-chart">
      {/* Recharts PieChart */}
    </div>
  );
}

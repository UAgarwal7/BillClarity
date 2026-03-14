// SectionSelector — Checkbox list of appeal packet sections to include

import React from "react";

const AVAILABLE_SECTIONS = [
  { key: "bill_explanation", label: "Bill Explanation Report" },
  { key: "flagged_issues", label: "Flagged Issue Summary" },
  { key: "benchmark_analysis", label: "Benchmark Comparison Report" },
  { key: "insurance_insights", label: "Insurance Rule Insights" },
  { key: "appeal_letter", label: "Formal Appeal Letter" },
  { key: "coding_review_request", label: "Coding Review Request" },
  { key: "negotiation_script", label: "Negotiation Script" },
  { key: "evidence_checklist", label: "Evidence Checklist" },
] as const;

interface SectionSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function SectionSelector({ selected, onChange }: SectionSelectorProps) {
  // TODO: Render checkboxes for each section
  // TODO: Select all / deselect all toggle
  return (
    <div className="section-selector">
      {/* Checkboxes */}
    </div>
  );
}

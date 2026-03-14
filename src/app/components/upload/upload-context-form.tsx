// UploadContextForm — Optional context fields at upload time
// Insurance provider, visit type, suspected issue, notes

import React from "react";

export interface UploadContext {
  insuranceProvider: string;
  visitType: "emergency" | "outpatient" | "inpatient" | "imaging" | "other";
  suspectedIssue: string;
  notes: string;
}

interface UploadContextFormProps {
  value: UploadContext;
  onChange: (context: UploadContext) => void;
}

export function UploadContextForm({ value, onChange }: UploadContextFormProps) {
  // TODO: Insurance provider text input
  // TODO: Visit type dropdown select
  // TODO: Suspected issue textarea
  // TODO: Notes textarea
  return (
    <form className="upload-context-form">
      {/* Context fields */}
    </form>
  );
}

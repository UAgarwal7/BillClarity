// UploadProgress — Multi-step progress indicator during parsing pipeline
// Steps: Uploading → Extracting text → Classifying → Analyzing → Detecting issues

import React from "react";

type PipelineStep =
  | "uploading"
  | "extracting"
  | "classifying"
  | "analyzing"
  | "detecting"
  | "completed"
  | "failed";

interface UploadProgressProps {
  currentStep: PipelineStep;
  error?: string;
}

export function UploadProgress({ currentStep, error }: UploadProgressProps) {
  // TODO: Render step indicators with active/completed/pending states
  // TODO: Animate transitions between steps
  // TODO: Show error state if pipeline fails
  return (
    <div className="upload-progress">
      {/* Step indicators */}
    </div>
  );
}

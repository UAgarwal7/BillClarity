// UploadProgress — Multi-step progress indicator for the AWS parsing pipeline
// Steps: Uploading → OCR (Textract) → Medical NLP (Comprehend) → Classifying → Analyzing → Detecting → Complete

import React from "react";

type PipelineStep =
  | "uploading"
  | "ocr"
  | "medical_nlp"
  | "classifying"
  | "extracting"
  | "benchmarking"
  | "detecting"
  | "insights"
  | "completed"
  | "failed";

interface UploadProgressProps {
  currentStep: PipelineStep;
  error?: string;
}

const PIPELINE_STEPS: { key: PipelineStep; label: string; icon: string }[] = [
  { key: "uploading", label: "Uploading to S3...", icon: "☁️" },
  { key: "ocr", label: "Running OCR (AWS Textract)...", icon: "📄" },
  { key: "medical_nlp", label: "Analyzing medical terminology (AWS Comprehend Medical)...", icon: "🏥" },
  { key: "classifying", label: "Classifying document (Gemini)...", icon: "🏷️" },
  { key: "extracting", label: "Extracting line items (Gemini)...", icon: "📋" },
  { key: "benchmarking", label: "Benchmarking charges...", icon: "📊" },
  { key: "detecting", label: "Detecting errors...", icon: "🔍" },
  { key: "insights", label: "Generating insights...", icon: "💡" },
  { key: "completed", label: "Analysis complete!", icon: "✅" },
];

export function UploadProgress({ currentStep, error }: UploadProgressProps) {
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.key === currentStep);

  if (currentStep === "failed") {
    return (
      <div className="upload-progress error">
        <div className="step-indicator failed">
          <span className="step-icon">❌</span>
          <span className="step-label">Processing failed</span>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  return (
    <div className="upload-progress">
      {PIPELINE_STEPS.map((step, index) => {
        let status: "completed" | "active" | "pending" = "pending";
        if (index < currentIndex) status = "completed";
        else if (index === currentIndex) status = "active";

        return (
          <div key={step.key} className={`step-indicator ${status}`}>
            <span className="step-icon">{step.icon}</span>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

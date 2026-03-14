// useFileUpload — Handle multi-file upload with progress tracking

import { useState } from "react";

interface UploadResult {
  billId: string;
  status: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  // TODO: upload(files, context) → POST /api/bills/upload (multipart/form-data)
  // TODO: Track upload progress via XMLHttpRequest or fetch events

  const upload = async (_files: File[], _context?: Record<string, string>) => {};
  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return { uploading, progress, error, result, upload, reset };
}

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

  const upload = async (files: File[], context?: Record<string, string>) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      xhr.open("POST", `${apiUrl}/api/bills/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            setResult({
              billId: responseData.bill_id,
              status: responseData.status || "uploaded",
            });
            resolve();
          } catch (e) {
            setError("Failed to parse response");
            reject(e);
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            setError(errData.detail || `Upload failed (${xhr.status})`);
          } catch (e) {
            setError(`Upload failed with status ${xhr.status}`);
          }
          reject(new Error(xhr.statusText));
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setError("Network error occurred during upload");
        reject(new Error("Network error"));
      };

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          if (value) formData.append(key, value);
        });
      }

      xhr.send(formData);
    });
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return { uploading, progress, error, result, upload, reset };
}

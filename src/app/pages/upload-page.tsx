import { useState, useEffect, useCallback } from "react";
import { Upload, File, X, Loader2, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useFileUpload } from "@/app/hooks/use-file-upload";
import { useBillContext } from "@/app/context/bill-context";
import { billsApi } from "@/app/services/bills-api";
import type { Bill } from "@/app/types/bill";

export function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { upload, uploading, progress, error, result } = useFileUpload();
  const { setBillId } = useBillContext();
  const navigate = useNavigate();

  // Recent bills state
  const [pastBills, setPastBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPastBills = useCallback(async () => {
    setBillsLoading(true);
    setBillsError(null);
    try {
      const data = await billsApi.listBills();
      setPastBills(data.bills);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load bills";
      setBillsError(msg);
    } finally {
      setBillsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPastBills();
  }, [loadPastBills]);

  // Auto-navigate and reload list after upload succeeds
  useEffect(() => {
    if (result?.billId) {
      setBillId(result.billId);
      navigate("/app/bill-overview");
    }
  }, [result, setBillId, navigate]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    await upload(files);
  };

  const handleLoadBill = (bill: Bill) => {
    setBillId(bill._id);
    navigate("/app/bill-overview");
  };

  const handleDeleteBill = async (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    setDeletingId(billId);
    try {
      await billsApi.deleteBill(billId);
      setPastBills((prev) => prev.filter((b) => b._id !== billId));
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Upload Medical Bill</h1>
        <p className="text-muted-foreground">
          Upload your medical bill or insurance explanation of benefits to begin analysis.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="mb-2">Drop your files here, or click to browse</p>
        <p className="text-sm text-muted-foreground mb-6">Accepted formats: PDF, PNG, JPG</p>
        <label className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer">
          Select Files
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleChange}
          />
        </label>
      </div>

      {/* File List + Upload Controls */}
      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4">Selected Files</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {!result && (
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "Uploading..." : "Process Documents"}
              </button>
            </div>
          )}

          {(uploading || result || error) && (
            <div className="mt-8 p-6 bg-card border border-border rounded-lg">
              <h3 className="mb-4 font-semibold text-lg">Pipeline Status</h3>
              {error ? (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                  {error}
                </div>
              ) : (
                <div className="space-y-4">
                  {uploading && (
                    <>
                      <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  )}
                  {result && (
                    <div className="p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md">
                      Upload successful — navigating to overview…
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Bills */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">Recent Bills</h2>
          {billsLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {billsError && (
          <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md mb-4">
            {billsError}
          </div>
        )}

        {!billsLoading && !billsError && pastBills.length === 0 && (
          <p className="text-muted-foreground">No bills uploaded yet.</p>
        )}

        {pastBills.length > 0 && (
          <div className="space-y-3">
            {pastBills.map((bill) => (
              <div
                key={bill._id}
                onClick={() => handleLoadBill(bill)}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-secondary/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <StatusIcon status={bill.parsing_status} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {bill.provider ?? bill.facility ?? "Unknown Provider"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(bill.created_at).toLocaleDateString()}
                      </span>
                      {bill.total_billed != null && (
                        <span className="text-xs text-muted-foreground">
                          ${bill.total_billed.toLocaleString()} billed
                        </span>
                      )}
                      <StatusBadge status={bill.parsing_status} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteBill(e, bill._id)}
                  disabled={deletingId === bill._id}
                  className="ml-4 p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground disabled:opacity-50 flex-shrink-0"
                  aria-label="Delete bill"
                >
                  {deletingId === bill._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={1.5} />;
  if (status === "failed") return <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" strokeWidth={1.5} />;
  return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-500/10 text-green-600",
    failed: "bg-destructive/10 text-destructive",
    processing: "bg-primary/10 text-primary",
    pending: "bg-secondary text-muted-foreground",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

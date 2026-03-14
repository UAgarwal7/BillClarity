import { useState } from "react";
import { Upload, File, X } from "lucide-react";

export function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
        className={`
          border-2 border-dashed rounded-lg p-16 text-center transition-colors
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="mb-2">Drop your files here, or click to browse</p>
        <p className="text-sm text-muted-foreground mb-6">
          Accepted formats: PDF, PNG, JPG
        </p>
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

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4">Uploaded Files</h3>
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
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
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
          <button className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Process Documents
          </button>
        </div>
      )}
    </div>
  );
}

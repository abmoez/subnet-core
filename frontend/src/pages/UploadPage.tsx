import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileUp, CheckCircle, AlertCircle, FileText, Network, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadService } from '../services/upload.service';
import { UploadResult } from '../types';

const ACCEPTED_EXTENSIONS = new Set(['.csv', '.json']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export default function UploadPage() {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback((file: File) => {
    const ext = getFileExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.has(ext)) {
      toast.error('Only CSV and JSON files are accepted');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 5MB');
      return;
    }
    setSelectedFile(file);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const uploadResult = await uploadService.upload(selectedFile);
      setResult(uploadResult);
      queryClient.invalidateQueries({ queryKey: ['subnets'] });
      queryClient.invalidateQueries({ queryKey: ['ips'] });

      const totalFailed = uploadResult.subnets.failed + uploadResult.ips.failed;
      if (totalFailed === 0) {
        toast.success(
          `Imported ${uploadResult.subnets.created} subnet(s) and ${uploadResult.ips.created} IP(s)`,
        );
      } else {
        toast.success(`Imported with ${totalFailed} error(s). Check the results below.`);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Upload failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload File</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bulk-import subnets and IP addresses from a CSV or JSON file.
        </p>
      </div>

      <div className="card">
        <div className="mb-4 space-y-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-blue-800">CSV Format</h3>
            <p className="text-xs text-blue-700">
              Required: <code className="rounded bg-blue-100 px-1">cidr</code>,
              <code className="rounded bg-blue-100 px-1 ml-1">name</code> | Optional:
              <code className="rounded bg-blue-100 px-1 ml-1">description</code>,
              <code className="rounded bg-blue-100 px-1 ml-1">ip</code>,
              <code className="rounded bg-blue-100 px-1 ml-1">ip_name</code>
              <span className="text-blue-500"> (required with ip)</span>,
              <code className="rounded bg-blue-100 px-1 ml-1">ip_description</code>,
              <code className="rounded bg-blue-100 px-1 ml-1">ip_status</code>
            </p>
            <p className="mt-1.5 text-xs text-blue-600">
              Rows sharing the same CIDR are grouped into one subnet. IPs are optional per row but
              need a name when provided.
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-blue-100/70 p-2 text-xs text-blue-800">
{`cidr,name,description,ip,ip_name,ip_description,ip_status
10.0.1.0/24,Office LAN,Main office,10.0.1.10,Web Server,Primary web,active
10.0.1.0/24,,,10.0.1.50,Printer,Office printer,reserved`}
            </pre>
          </div>

          <div className="rounded-lg bg-emerald-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-emerald-800">JSON Format</h3>
            <p className="text-xs text-emerald-700">
              Array of subnet objects with <code className="rounded bg-emerald-100 px-1">cidr</code>,
              <code className="rounded bg-emerald-100 px-1 ml-1">name</code>, optional
              <code className="rounded bg-emerald-100 px-1 ml-1">description</code>, and an optional
              <code className="rounded bg-emerald-100 px-1 ml-1">ips</code> array.
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-emerald-100/70 p-2 text-xs text-emerald-800">
{`[{
  "cidr": "10.0.1.0/24",
  "name": "Office LAN",
  "ips": [
    { "address": "10.0.1.10", "name": "Web Server", "status": "active" }
  ]
}]`}
            </pre>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Network address, default gateway, and broadcast address are automatically reserved when
            a subnet is created — no need to include them in your file.
          </p>
        </div>

        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
              isDragging
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,.json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            <FileUp
              className={`mb-3 h-10 w-10 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
            />
            <p className="mb-1 text-sm font-medium text-gray-700">
              Drop your CSV or JSON file here, or click to browse
            </p>
            <p className="text-xs text-gray-500">CSV and JSON files up to 5MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={reset}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>

            {!result && (
              <button onClick={handleUpload} disabled={isUploading} className="btn-primary w-full">
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload &amp; Process
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Network className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subnets
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {result.subnets.created}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">created</span>
                  </div>
                  {result.subnets.failed > 0 && (
                    <div>
                      <span className="text-2xl font-bold text-red-600">
                        {result.subnets.failed}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">failed</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-400">of {result.subnets.total}</span>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    IP Addresses
                  </span>
                </div>
                {result.ips.total === 0 ? (
                  <p className="text-sm text-gray-400">No IPs in file</p>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        {result.ips.created}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">created</span>
                    </div>
                    {result.ips.failed > 0 && (
                      <div>
                        <span className="text-2xl font-bold text-red-600">
                          {result.ips.failed}
                        </span>
                        <span className="ml-1 text-xs text-gray-500">failed</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-400">of {result.ips.total}</span>
                  </div>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    {result.errors.length} error{result.errors.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">
                      <span className="font-mono font-medium">{err.row}</span>: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  All rows imported successfully
                </span>
              </div>
            )}

            <button onClick={reset} className="btn-secondary w-full">
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

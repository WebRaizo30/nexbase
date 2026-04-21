"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, ApiError, apiUpload } from "@/lib/api";

type FileRow = {
  id: string;
  name: string;
  size: number;
  url: string;
  key: string;
  createdAt: string;
  downloadUrl: string;
  downloadUrlExpiresInSeconds: number;
};

type SetupBody = {
  code?: string;
  setupSteps?: string[];
  message?: string;
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupBody | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSetup(null);
    try {
      const data = await apiJson<{ files: FileRow[] }>("/api/files");
      setFiles(data.files);
    } catch (e) {
      if (e instanceof ApiError && e.status === 503 && e.body && typeof e.body === "object") {
        setSetup(e.body as SetupBody);
        setFiles([]);
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to load files");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setSetup(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await apiUpload<{ file: { id: string } }>("/api/files/upload", form);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503 && err.body && typeof err.body === "object") {
        setSetup(err.body as SetupBody);
      } else if (err instanceof ApiError) {
        setError(
          typeof err.body === "object" && err.body && "error" in err.body
            ? String((err.body as { error: string }).error)
            : err.message,
        );
      } else {
        setError("Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(id: string) {
    setError(null);
    setSetup(null);
    setBusyId(id);
    try {
      await apiJson(`/api/files/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 503 && e.body && typeof e.body === "object") {
        setSetup(e.body as SetupBody);
      } else if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Delete failed");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="crt-badge mb-3">VAULT</p>
        <h1 className="crt-title text-3xl">Files</h1>
        <p className="crt-subtitle mt-3 text-sm">
          Binary objects route through your API to S3. Missing AWS credentials surface a setup manifest instead of a
          crash.
        </p>
      </div>

      <div>
        <label className="crt-btn-ghost cursor-pointer py-3">
          <input type="file" className="hidden" onChange={(e) => void onFile(e)} disabled={uploading} />
          {uploading ? "Uploading…" : "Select file"}
        </label>
      </div>

      {error ? <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">{error}</p> : null}

      {setup?.setupSteps?.length ? (
        <div className="crt-alert rounded-sm p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-phosphor-bright">
            {setup.message ?? "S3 is not configured yet."}
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 font-mono text-xs leading-relaxed text-foreground">
            {setup.setupSteps.map((step) => (
              <li key={step} className="normal-case tracking-normal">
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crt-muted">Loading…</p>
      ) : null}

      {!loading && !setup ? (
        <div className="crt-table-wrap">
          <table className="w-full text-left text-sm">
            <thead className="bg-crt-panel/80 font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Size</th>
                <th className="px-3 py-3">Download</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="bg-crt-panel/40">
              {files.map((f) => (
                <tr key={f.id} className="border-t border-crt-border">
                  <td className="px-3 py-3 font-medium">{f.name}</td>
                  <td className="px-3 py-3 text-crt-muted">{(f.size / 1024).toFixed(1)} KB</td>
                  <td className="px-3 py-3">
                    <a href={f.downloadUrl} className="crt-link text-xs font-semibold uppercase tracking-wider" rel="noreferrer" target="_blank">
                      Stream
                    </a>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyId === f.id}
                      onClick={() => void removeFile(f.id)}
                      className="font-mono text-xs uppercase tracking-wider text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center font-mono text-xs text-crt-muted">
                    No files yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

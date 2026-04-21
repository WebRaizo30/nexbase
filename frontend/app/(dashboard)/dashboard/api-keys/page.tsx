"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, ApiError } from "@/lib/api";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsed: string | null;
};

export default function ApiKeysPage() {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ apiKeys: ApiKeyRow[] }>("/api/api-keys");
      setRows(data.apiKeys);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to load API keys");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedSecret(null);
    try {
      const data = await apiJson<{ apiKey: { id: string; name: string; key: string; createdAt: string }; message: string }>(
        "/api/api-keys",
        { method: "POST", body: JSON.stringify({ name }) },
      );
      setCreatedSecret(data.apiKey.key);
      setName("");
      await load();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Create failed");
      }
    }
  }

  async function removeKey(id: string) {
    setError(null);
    setBusyId(id);
    try {
      await apiJson(`/api/api-keys/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      if (e instanceof ApiError) {
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
        <p className="crt-badge mb-3">TOKENS</p>
        <h1 className="crt-title text-3xl">API keys</h1>
        <p className="crt-subtitle mt-3 text-sm">
          Full secrets render once at creation. Treat them like root passwords.
        </p>
      </div>

      <form
        onSubmit={createKey}
        className="crt-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="keyName" className="crt-label">
            Label
          </label>
          <input
            id="keyName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. CI, local dev"
            className="crt-input mt-2"
          />
        </div>
        <button type="submit" className="crt-btn-primary sm:shrink-0">
          Mint key
        </button>
      </form>

      {createdSecret ? (
        <div className="crt-alert crt-alert-ok rounded-sm p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-phosphor-bright">
            New key — copy now
          </p>
          <code className="crt-input mt-3 block break-all font-mono text-[0.7rem] text-phosphor-bright">
            {createdSecret}
          </code>
        </div>
      ) : null}

      {error ? <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">{error}</p> : null}

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crt-muted">Loading…</p>
      ) : null}

      {!loading ? (
        <div className="crt-table-wrap">
          <table className="w-full text-left text-sm">
            <thead className="bg-crt-panel/80 font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Key</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="bg-crt-panel/40">
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-crt-border">
                  <td className="px-3 py-3 font-medium">{r.name}</td>
                  <td className="px-3 py-3 font-mono text-xs text-phosphor-bright/90">{r.keyPreview}</td>
                  <td className="px-3 py-3 text-crt-muted">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void removeKey(r.id)}
                      className="font-mono text-xs uppercase tracking-wider text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center font-mono text-xs text-crt-muted">
                    No API keys yet.
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

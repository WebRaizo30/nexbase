"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, ApiError } from "@/lib/api";
import { useDashboardMe } from "@/components/dashboard/dashboard-session";

type Stats = {
  counts: {
    users: number;
    subscriptions: number;
    apiKeys: number;
    files: number;
    analyticsDays: number;
  };
  demo: boolean;
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  apiKeyCount: number;
  fileCount: number;
};

export default function AdminPage() {
  const me = useDashboardMe();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const load = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [s, u] = await Promise.all([
        apiJson<Stats>("/api/admin/stats"),
        apiJson<{ users: AdminUser[]; total: number }>("/api/admin/users?take=50"),
      ]);
      setStats(s);
      setUsers(u.users);
      setTotal(u.total);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Failed to load admin data");
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (me?.role === "admin") {
      void load();
    }
  }, [me, load]);

  if (me === undefined) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crt-muted">Loading session…</p>
      </div>
    );
  }

  if (me === null) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="crt-alert crt-alert-bad rounded-sm p-4 font-mono text-sm">Session expired</p>
      </div>
    );
  }

  if (me.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg">
        <p className="crt-badge mb-3">FORBIDDEN</p>
        <h1 className="crt-title text-2xl">Admin</h1>
        <p className="crt-alert crt-alert-bad mt-4 rounded-sm p-4 font-mono text-sm">
          Admin access required. Add your email to <code className="crt-kbd">ADMIN_EMAILS</code> before
          registering, or run <code className="crt-kbd">npx prisma db seed</code> with{" "}
          <code className="crt-kbd">ADMIN_SEED_EMAIL</code>.
        </p>
      </div>
    );
  }

  if (loadingData && !stats) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crt-muted">Loading admin…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="crt-badge mb-3">ERROR</p>
        <h1 className="crt-title text-2xl">Admin</h1>
        <p className="crt-alert crt-alert-bad mt-4 rounded-sm p-4 font-mono text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="crt-badge mb-3">ROOT</p>
        <h1 className="crt-title text-3xl">Admin</h1>
        <p className="crt-subtitle mt-3 text-sm">Live counts from the database · demo-friendly.</p>
      </div>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["Users", stats.counts.users],
              ["Subscriptions", stats.counts.subscriptions],
              ["API keys", stats.counts.apiKeys],
              ["Files", stats.counts.files],
              ["Metric days", stats.counts.analyticsDays],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="crt-panel p-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">{k}</p>
              <p className="mt-2 font-display text-2xl font-bold text-phosphor-bright">{v}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="crt-table-wrap">
        <div className="border-b border-crt-border bg-crt-panel/80 px-4 py-3 font-mono text-xs uppercase tracking-widest text-phosphor-bright">
          Users ({total})
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-crt-panel/80 font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">
            <tr>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Keys</th>
              <th className="px-3 py-3">Files</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="bg-crt-panel/40">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-crt-border">
                <td className="px-3 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-3">
                  <span className="crt-badge text-[0.6rem]">{u.role}</span>
                </td>
                <td className="px-3 py-3 text-crt-muted">{u.apiKeyCount}</td>
                <td className="px-3 py-3 text-crt-muted">{u.fileCount}</td>
                <td className="px-3 py-3 text-crt-muted">{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center font-mono text-xs text-crt-muted">
                  No users.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

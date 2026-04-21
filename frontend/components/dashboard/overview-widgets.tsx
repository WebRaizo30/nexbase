"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson, ApiError } from "@/lib/api";
import { nexbaseConfig } from "@/lib/nexbase-config";

type Summary = {
  user: { name: string | null; email: string; role: string };
  counts: { apiKeys: number; files: number };
  subscription: { plan: string; status: string; currentPeriodEnd: string } | null;
  pulse: {
    date: string;
    signups: number;
    activeUsers: number;
    apiCalls: number;
    revenueCents: number;
  } | null;
};

const quickLinks = [
  { href: "/dashboard/analytics", label: "Analytics", hint: "Demo series" },
  { href: "/dashboard/billing", label: "Billing", hint: "Stripe optional" },
  { href: "/dashboard/api-keys", label: "API keys", hint: "Automation" },
  { href: "/dashboard/files", label: "Files", hint: "S3 optional" },
] as const;

export function OverviewWidgets() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await apiJson<Summary>("/api/dashboard/summary");
      setData(s);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Could not load summary");
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">
        {error}{" "}
        <button type="button" onClick={() => void load()} className="crt-link ml-2">
          Retry
        </button>
      </p>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="crt-panel h-24 animate-pulse bg-crt-panel/50" />
        ))}
      </div>
    );
  }

  const greeting = data.user.name?.trim() || data.user.email.split("@")[0];
  const sub = data.subscription;

  return (
    <div className="space-y-8">
      <p className="font-display text-lg text-phosphor-bright [text-shadow:0_0_12px_var(--crt-glow)]">
        Hey, <span className="text-foreground">{greeting}</span>
        {data.user.role === "admin" ? (
          <span className="ml-2 align-middle font-mono text-[0.6rem] uppercase tracking-widest">
            <span className="crt-badge">admin</span>
          </span>
        ) : null}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="crt-panel p-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">API keys</p>
          <p className="mt-2 font-display text-3xl font-bold text-phosphor-bright">{data.counts.apiKeys}</p>
        </div>
        <div className="crt-panel p-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">Files</p>
          <p className="mt-2 font-display text-3xl font-bold text-phosphor-bright">{data.counts.files}</p>
        </div>
        <div className="crt-panel p-4 sm:col-span-2">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">Subscription</p>
          {sub ? (
            <>
              <p className="mt-2 font-display text-xl font-bold capitalize text-phosphor-bright">{sub.plan}</p>
              <p className="crt-subtitle mt-1 text-xs">
                {sub.status} · renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p className="crt-subtitle mt-2 text-sm">No active plan · open billing to connect Stripe.</p>
          )}
        </div>
      </div>

      {data.pulse ? (
        <div className="crt-panel crt-panel-glow p-5">
          <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-phosphor-bright">
            Platform pulse · demo · {data.pulse.date}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["Active (demo)", String(data.pulse.activeUsers)],
                ["Signups", String(data.pulse.signups)],
                ["API calls", data.pulse.apiCalls >= 1000 ? `${(data.pulse.apiCalls / 1000).toFixed(1)}k` : String(data.pulse.apiCalls)],
                ["Rev", `$${(data.pulse.revenueCents / 100).toLocaleString()}`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-sm border border-crt-border/60 bg-black/5 px-3 py-2 dark:bg-white/5">
                <p className="font-mono text-[0.6rem] uppercase tracking-wider text-crt-muted">{k}</p>
                <p className="mt-1 font-mono text-sm font-bold text-foreground">{v}</p>
              </div>
            ))}
          </div>
          <p className="crt-subtitle mt-3 text-[0.65rem]">
            Seeded metrics for portfolio UI — swap for real telemetry when you wire production analytics.
          </p>
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-phosphor-bright">
          Quick routes
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="crt-panel flex items-center justify-between p-4 transition hover:border-phosphor/40"
            >
              <span className="font-display font-bold tracking-tight">{q.label}</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-crt-muted">{q.hint}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="crt-panel p-5 font-mono text-xs uppercase tracking-widest text-crt-muted">
        <p className="text-phosphor-bright">STATUS</p>
        <p className="mt-2 normal-case tracking-normal text-foreground">
          {nexbaseConfig.appName} · API{" "}
          <code className="crt-kbd">{process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}</code>
        </p>
        <p className="mt-4">
          <Link href="/dashboard/analytics" className="crt-link text-[0.65rem] font-bold uppercase tracking-widest">
            Full analytics boards →
          </Link>
        </p>
      </div>
    </div>
  );
}

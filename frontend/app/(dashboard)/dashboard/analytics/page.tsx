"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiJson, ApiError } from "@/lib/api";

type Point = {
  date: string;
  signups: number;
  activeUsers: number;
  apiCalls: number;
  revenueCents: number;
};

type RangeKey = 14 | 30 | 90 | "all";

const axisTick = { fill: "var(--crt-muted)", fontSize: 10, fontFamily: "var(--font-mono)" };
const gridStroke = "var(--crt-panel-border)";
const phosphor = "var(--crt-phosphor-bright)";
const phosphor2 = "var(--crt-phosphor)";
const phosphorDim = "rgba(92, 255, 154, 0.35)";

const tooltipStyle = {
  background: "var(--crt-panel)",
  border: "1px solid var(--crt-panel-border)",
  borderRadius: 2,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "0 0 20px var(--crt-glow-soft)",
};

function formatK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatUsdCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Compare average of first half vs second half of the window (+/- %). */
function periodDeltaPercent(data: Point[], key: keyof Pick<Point, "apiCalls" | "activeUsers" | "signups" | "revenueCents">): number | null {
  if (data.length < 6) return null;
  const mid = Math.floor(data.length / 2);
  const first = data.slice(0, mid);
  const second = data.slice(mid);
  const avg = (rows: Point[], k: typeof key) => rows.reduce((s, p) => s + Number(p[k]), 0) / rows.length;
  const a = avg(first, key);
  const b = avg(second, key);
  if (a === 0) return b > 0 ? 100 : null;
  return ((b - a) / a) * 100;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="font-mono text-[0.6rem] text-crt-muted">n/a</span>;
  const up = value >= 0;
  return (
    <span
      className={`font-mono text-[0.65rem] font-bold uppercase tracking-wider ${up ? "text-phosphor-bright" : "text-amber-600 dark:text-amber-400"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}% vs prior half
    </span>
  );
}

function MiniSpark({ points, dataKey, stroke }: { points: Point[]; dataKey: keyof Point; stroke: string }) {
  const data = points.map((p) => ({ y: Number(p[dataKey]) }));
  if (data.length < 2) return <div className="h-11 w-full rounded-sm bg-black/5 dark:bg-white/5" />;
  return (
    <div className="h-11 w-full opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <Line type="monotone" dataKey="y" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyticsPage() {
  const [series, setSeries] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ series: Point[]; demo: boolean }>("/api/analytics/overview");
      setSeries(data.series);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const windowed = useMemo(() => {
    if (series.length === 0) return [];
    if (range === "all") return series;
    return series.slice(-range);
  }, [series, range]);

  const last = windowed.length ? windowed[windowed.length - 1] : null;

  const totals = useMemo(() => {
    if (!windowed.length) return null;
    return {
      signups: windowed.reduce((s, p) => s + p.signups, 0),
      apiCalls: windowed.reduce((s, p) => s + p.apiCalls, 0),
      revenueCents: windowed.reduce((s, p) => s + p.revenueCents, 0),
      avgActive: Math.round(windowed.reduce((s, p) => s + p.activeUsers, 0) / windowed.length),
    };
  }, [windowed]);

  const deltas = useMemo(
    () => ({
      apiCalls: periodDeltaPercent(windowed, "apiCalls"),
      activeUsers: periodDeltaPercent(windowed, "activeUsers"),
      signups: periodDeltaPercent(windowed, "signups"),
      revenue: periodDeltaPercent(windowed, "revenueCents"),
    }),
    [windowed],
  );

  const sparkSource = useMemo(() => {
    const n = Math.min(28, series.length);
    return series.slice(-n);
  }, [series]);

  const rangeButtons: { key: RangeKey; label: string }[] = [
    { key: 14, label: "14d" },
    { key: 30, label: "30d" },
    { key: 90, label: "90d" },
    { key: "all", label: "ALL" },
  ];

  const tableRows = useMemo(() => [...windowed].reverse().slice(0, 10), [windowed]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="crt-badge mb-3">METRICS · DEMO</p>
          <h1 className="crt-title text-3xl">Analytics</h1>
          <p className="crt-subtitle mt-3 max-w-2xl text-sm">
            Seeded <code className="crt-kbd">AnalyticsDaily</code> series — range filters are client-side. Plug in your warehouse or
            event stream when you go live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-crt-muted">Window</span>
          {rangeButtons.map((b) => (
            <button
              key={String(b.key)}
              type="button"
              onClick={() => setRange(b.key)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider transition ${
                range === b.key
                  ? "border-phosphor/50 bg-phosphor/10 text-phosphor-bright shadow-glow"
                  : "border-crt-border text-crt-muted hover:border-phosphor/30 hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className="crt-btn-ghost py-1.5 text-[0.65rem]"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="crt-panel h-32 animate-pulse bg-crt-panel/40" />
          ))}
        </div>
      ) : null}
      {error ? <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">{error}</p> : null}

      {last && totals ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              {
                label: "Active users",
                value: String(last.activeUsers),
                sub: <DeltaBadge value={deltas.activeUsers} />,
                spark: "activeUsers" as const,
              },
              {
                label: "Signups (window)",
                value: String(totals.signups),
                sub: <DeltaBadge value={deltas.signups} />,
                spark: "signups" as const,
              },
              {
                label: "API calls (window)",
                value: formatK(totals.apiCalls),
                sub: <DeltaBadge value={deltas.apiCalls} />,
                spark: "apiCalls" as const,
              },
              {
                label: "Revenue (window)",
                value: formatUsdCents(totals.revenueCents),
                sub: <DeltaBadge value={deltas.revenue} />,
                spark: "revenueCents" as const,
              },
            ] as const
          ).map((card) => (
            <div key={card.label} className="crt-panel crt-panel-glow flex flex-col p-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-phosphor-bright [text-shadow:0_0_14px_var(--crt-glow)]">
                {card.value}
              </p>
              <div className="mt-2">{card.sub}</div>
              <div className="mt-3 border-t border-crt-border/50 pt-2">
                <p className="mb-1 font-mono text-[0.55rem] uppercase tracking-wider text-crt-muted">Trace</p>
                <MiniSpark points={sparkSource} dataKey={card.spark} stroke={phosphor} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {totals ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="crt-panel p-5 lg:col-span-1">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-phosphor-bright">Window summary</p>
            <ul className="mt-4 space-y-3 font-mono text-xs">
              <li className="flex justify-between border-b border-crt-border/40 pb-2">
                <span className="text-crt-muted">Days</span>
                <span className="text-foreground">{windowed.length}</span>
              </li>
              <li className="flex justify-between border-b border-crt-border/40 pb-2">
                <span className="text-crt-muted">Avg active / day</span>
                <span className="text-phosphor-bright">{totals.avgActive}</span>
              </li>
              <li className="flex justify-between border-b border-crt-border/40 pb-2">
                <span className="text-crt-muted">Signups total</span>
                <span>{totals.signups}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-crt-muted">API calls total</span>
                <span>{formatK(totals.apiCalls)}</span>
              </li>
            </ul>
          </div>
          <div className="crt-panel p-5 lg:col-span-2">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-phosphor-bright">
              Signups · daily bars
            </p>
            <div className="mt-4 h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={windowed} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} width={32} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [value == null ? 0 : Number(value), "Signups"]}
                  />
                  <Bar dataKey="signups" name="Signups" fill={phosphorDim} stroke={phosphor} strokeWidth={1} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && windowed.length > 0 ? (
        <div className="crt-panel crt-panel-glow p-4 sm:p-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-phosphor-bright">
            Usage pulse · area + line
          </p>
          <div className="mt-4 h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={windowed} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillApi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={phosphor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={phosphor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} opacity={0.6} />
                <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} minTickGap={32} />
                <YAxis tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="apiCalls"
                  name="API calls"
                  stroke={phosphor}
                  fill="url(#fillApi)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  name="Active users"
                  stroke={phosphor2}
                  dot={false}
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {!loading && windowed.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="crt-panel p-4 sm:p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-phosphor-bright">Revenue trace</p>
            <div className="mt-4 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={windowed} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} opacity={0.6} />
                  <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} minTickGap={28} />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    width={48}
                    tickFormatter={(v) =>
                      `$${Number(v) / 100 >= 1000 ? `${(Number(v) / 100000).toFixed(1)}k` : (Number(v) / 100).toFixed(0)}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => {
                      const cents = value == null ? 0 : Number(value);
                      const usd = (Number.isFinite(cents) ? cents : 0) / 100;
                      return [`$${usd.toFixed(2)}`, "Revenue"];
                    }}
                    contentStyle={{ ...tooltipStyle, boxShadow: "0 0 16px var(--crt-glow-soft)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenueCents"
                    name="Revenue"
                    stroke={phosphor}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="crt-panel p-4 sm:p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-phosphor-bright">
              Signups vs active users
            </p>
            <p className="crt-subtitle mt-1 text-[0.7rem]">Dual axis — scales differ; compare shape, not magnitude.</p>
            <div className="mt-4 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={windowed} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} opacity={0.5} />
                  <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} minTickGap={28} />
                  <YAxis
                    yAxisId="L"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    width={34}
                    label={{ value: "Signups", angle: -90, position: "insideLeft", fill: "var(--crt-muted)", fontSize: 9 }}
                  />
                  <YAxis
                    yAxisId="R"
                    orientation="right"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    width={40}
                    label={{ value: "Active", angle: 90, position: "insideRight", fill: "var(--crt-muted)", fontSize: 9 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                  <Line
                    yAxisId="L"
                    type="monotone"
                    dataKey="signups"
                    name="Signups"
                    stroke={phosphor}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="R"
                    type="monotone"
                    dataKey="activeUsers"
                    name="Active users"
                    stroke={phosphor2}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && tableRows.length > 0 ? (
        <div className="crt-table-wrap">
          <div className="border-b border-crt-border bg-crt-panel/80 px-4 py-3 font-mono text-xs uppercase tracking-widest text-phosphor-bright">
            Recent days (latest 10 in window)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-crt-panel/80 font-mono text-[0.65rem] uppercase tracking-widest text-crt-muted">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Signups</th>
                  <th className="px-3 py-3">Active</th>
                  <th className="px-3 py-3">API</th>
                  <th className="px-3 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-crt-panel/40 font-mono text-xs">
                {tableRows.map((row) => (
                  <tr key={row.date} className="border-t border-crt-border">
                    <td className="px-3 py-2.5 text-phosphor-bright">{row.date}</td>
                    <td className="px-3 py-2.5">{row.signups}</td>
                    <td className="px-3 py-2.5">{row.activeUsers}</td>
                    <td className="px-3 py-2.5 text-crt-muted">{formatK(row.apiCalls)}</td>
                    <td className="px-3 py-2.5">{formatUsdCents(row.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && series.length === 0 && !error ? (
        <p className="crt-subtitle font-mono text-sm">
          No rows in <code className="crt-kbd">AnalyticsDaily</code>. Run{" "}
          <code className="crt-kbd">npx prisma db seed</code> in the backend.
        </p>
      ) : null}
    </div>
  );
}

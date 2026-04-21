import Link from "next/link";
import { nexbaseConfig } from "@/lib/nexbase-config";

const stats = [
  { label: "API routes", value: "40+", hint: "auth, billing, files…" },
  { label: "Deploy targets", value: "2", hint: "Vercel + Railway" },
  { label: "Theme modes", value: "2", hint: "phosphor · paper" },
] as const;

const steps = [
  { n: "01", t: "Configure", d: "Clone, set .env, run Prisma. Stripe and S3 stay optional until you need them." },
  { n: "02", t: "Brand", d: "Edit nexbase.config.ts — name, plans, feature flags. Ship your story." },
  { n: "03", t: "Extend", d: "Add domains on the same stack: admin, analytics, webhooks, email." },
] as const;

const faq = [
  {
    q: "Do I need Stripe or AWS on day one?",
    a: "No. Billing and file routes return clear setup steps when keys are missing; the rest of the app runs locally.",
  },
  {
    q: "Is the analytics dashboard real?",
    a: "Charts use seeded demo series (AnalyticsDaily) so the UI never looks empty. Replace with your warehouse or events later.",
  },
  {
    q: "How does admin work?",
    a: "Set ADMIN_EMAILS for new signups, or run prisma db seed with ADMIN_SEED_EMAIL to promote or create an admin user.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="crt-grid-bg pointer-events-none absolute left-1/2 top-24 h-64 w-[120%] -translate-x-1/2" aria-hidden />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="crt-badge mx-auto mb-6">v0.1 · SIGNAL OK</p>
        <h1 className="crt-title text-balance text-4xl sm:text-6xl">{nexbaseConfig.appName}</h1>
        <p className="crt-subtitle mt-6 text-pretty text-lg sm:text-xl">{nexbaseConfig.appDescription}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="crt-btn-primary px-6 py-3 text-sm">
            Initialize
          </Link>
          <Link href="/pricing" className="crt-btn-ghost px-6 py-3 text-sm">
            View tariffs
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="crt-panel p-4 text-center sm:p-5">
            <p className="font-display text-2xl font-extrabold text-phosphor-bright sm:text-3xl [text-shadow:0_0_16px_var(--crt-glow)]">
              {s.value}
            </p>
            <p className="mt-1 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-crt-muted">{s.label}</p>
            <p className="crt-subtitle mt-2 text-[0.65rem] normal-case">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="relative mx-auto mt-24 grid max-w-3xl gap-6 sm:grid-cols-3">
        <div className="crt-panel crt-panel-glow p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-phosphor-bright">Auth</h2>
          <p className="crt-subtitle mt-3 text-sm leading-relaxed">
            JWT sessions, REST endpoints, and API keys for automation pipelines.
          </p>
        </div>
        <div className="crt-panel p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-phosphor-bright">Billing</h2>
          <p className="crt-subtitle mt-3 text-sm leading-relaxed">
            Stripe subscriptions when configured — stay local until you flip the switch.
          </p>
        </div>
        <div className="crt-panel p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-phosphor-bright">Storage</h2>
          <p className="crt-subtitle mt-3 text-sm leading-relaxed">
            S3-backed uploads with time-limited download URLs when AWS env is live.
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-24 max-w-3xl">
        <p className="crt-badge mb-6">PIPELINE</p>
        <h2 className="crt-title text-2xl sm:text-3xl">How teams ship with it</h2>
        <div className="mt-10 space-y-6">
          {steps.map((step) => (
            <div key={step.n} className="crt-panel flex gap-5 p-5 sm:p-6">
              <span className="font-mono text-lg font-bold text-phosphor-bright">{step.n}</span>
              <div>
                <p className="font-display text-lg font-bold tracking-tight">{step.t}</p>
                <p className="crt-subtitle mt-2 text-sm leading-relaxed">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-24 max-w-3xl">
        <p className="crt-badge mb-6">CHECKLIST</p>
        <h2 className="crt-title text-2xl sm:text-3xl">What you get in the box</h2>
        <ul className="mt-8 space-y-3 font-mono text-sm">
          {[
            "CRT-themed marketing + dashboard UI (dark phosphor + paper mode)",
            "Role-based admin console + seeded analytics charts",
            "Optional Resend welcome mail after registration",
            "Modular config file for product name and plan copy",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span className="text-phosphor-bright">▍</span>
              <span className="normal-case tracking-normal text-foreground/90">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-24 max-w-3xl">
        <p className="crt-badge mb-6">FAQ</p>
        <h2 className="crt-title text-2xl sm:text-3xl">Common questions</h2>
        <div className="mt-8 space-y-4">
          {faq.map((item) => (
            <div key={item.q} className="crt-panel p-5">
              <p className="font-display text-sm font-bold text-phosphor-bright">{item.q}</p>
              <p className="crt-subtitle mt-3 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-24 max-w-3xl">
        <div className="crt-panel crt-panel-glow flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.25em] text-phosphor-bright">
              Ready
            </p>
            <p className="mt-2 font-display text-xl font-bold tracking-tight">Spin up your workspace</p>
            <p className="crt-subtitle mt-2 max-w-md text-sm">Free to adapt. No filler accounts required for core flows.</p>
          </div>
          <Link href="/register" className="crt-btn-primary shrink-0 px-8 py-3">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { nexbaseConfig } from "@/lib/nexbase-config";

export default function PricingPage() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="crt-grid-bg pointer-events-none absolute inset-x-0 top-0 h-48 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="crt-badge mb-4">RATE CARD</p>
        <h1 className="crt-title text-3xl sm:text-5xl">Pricing</h1>
        <p className="crt-subtitle mt-4 text-sm sm:text-base">
          Plans ship from{" "}
          <code className="crt-kbd">nexbase.config.ts</code>. Live checkout reads Stripe Price IDs from your API{" "}
          <code className="crt-kbd">.env</code>.
        </p>
      </div>
      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        {nexbaseConfig.plans.map((plan, i) => (
          <div
            key={plan.name}
            className={`crt-panel flex flex-col p-6 ${i === 1 ? "crt-panel-glow md:-translate-y-1" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight">{plan.name}</h2>
              {i === 1 ? <span className="crt-badge">POPULAR</span> : null}
            </div>
            <p className="mt-4 font-display text-4xl font-extrabold tracking-tight text-phosphor-bright drop-shadow-[0_0_12px_var(--crt-glow)]">
              ${plan.price}
              <span className="ml-1 font-mono text-sm font-normal text-crt-muted">/mo</span>
            </p>
            <div className="crt-divider my-5" />
            <ul className="flex flex-1 flex-col gap-2 font-mono text-xs uppercase tracking-wider text-crt-muted">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-foreground">
                  <span className="text-phosphor-bright">▍</span>
                  <span className="normal-case tracking-normal">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="crt-btn-primary mt-8 w-full text-center">
              Select
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

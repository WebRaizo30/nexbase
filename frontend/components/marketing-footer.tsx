import Link from "next/link";
import { nexbaseConfig } from "@/lib/nexbase-config";

export function MarketingFooter() {
  return (
    <footer className="relative mt-24 border-t border-crt-border bg-crt-panel/40 backdrop-blur-sm">
      <div className="crt-grid-bg pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-sm font-extrabold tracking-tight text-phosphor-bright">
              {nexbaseConfig.appName}
            </p>
            <p className="crt-subtitle mt-3 text-xs leading-relaxed">{nexbaseConfig.appDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={nexbaseConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="crt-btn-icon py-2 text-[0.65rem] normal-case tracking-normal no-underline"
              >
                GitHub
              </a>
              <a
                href={nexbaseConfig.social.x}
                target="_blank"
                rel="noopener noreferrer"
                className="crt-btn-icon py-2 text-[0.65rem] normal-case tracking-normal no-underline"
              >
                X
              </a>
            </div>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-phosphor-bright">
              Product
            </p>
            <ul className="mt-4 space-y-2 font-mono text-xs uppercase tracking-wider">
              <li>
                <Link href="/pricing" className="crt-link no-underline hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/register" className="crt-link no-underline hover:underline">
                  Sign up
                </Link>
              </li>
              <li>
                <Link href="/login" className="crt-link no-underline hover:underline">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-phosphor-bright">
              Stack
            </p>
            <ul className="crt-subtitle mt-4 space-y-1.5 text-xs normal-case tracking-normal">
              <li>Next.js · Express · Prisma</li>
              <li>Stripe · S3 · Resend</li>
              <li>JWT · PostgreSQL</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-phosphor-bright">
              Signal
            </p>
            <p className="crt-subtitle mt-4 font-mono text-[0.7rem] leading-relaxed">
              Demo metrics &amp; charts are seeded for portfolio display. Swap in real pipelines when you ship.
            </p>
          </div>
        </div>
        <div className="crt-divider my-8" />
        <p className="text-center font-mono text-[0.65rem] uppercase tracking-[0.25em] text-crt-muted">
          © {new Date().getFullYear()} {nexbaseConfig.appName} · Built as a SaaS starter template
        </p>
      </div>
    </footer>
  );
}

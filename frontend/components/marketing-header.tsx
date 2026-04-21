import Link from "next/link";
import { nexbaseConfig } from "@/lib/nexbase-config";
import { ThemeToggle } from "@/components/theme-toggle";

export function MarketingHeader() {
  return (
    <header className="relative border-b border-crt-border/80 bg-crt-panel/60 backdrop-blur-md">
      <div className="crt-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="crt-badge border-phosphor/40 bg-black/5 text-[0.6rem] dark:bg-white/5">NB</span>
          <span className="font-display text-base font-extrabold tracking-tight text-foreground transition group-hover:text-phosphor-bright">
            {nexbaseConfig.appName}
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/pricing" className="crt-link px-1 text-xs font-semibold uppercase tracking-widest no-underline hover:underline">
            Pricing
          </Link>
          <Link href="/login" className="crt-link px-1 text-xs font-semibold uppercase tracking-widest no-underline hover:underline">
            Log in
          </Link>
          <Link href="/register" className="crt-btn-primary py-2 text-[0.65rem] sm:text-sm">
            Start
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

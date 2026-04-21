import Link from "next/link";
import { nexbaseConfig } from "@/lib/nexbase-config";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="crt-grid-bg pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <header className="relative z-10 flex items-center justify-between border-b border-crt-border bg-crt-panel/50 px-4 py-4 backdrop-blur-md sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="crt-badge">SECURE</span>
          <span className="font-display text-sm font-extrabold tracking-tight">{nexbaseConfig.appName}</span>
        </Link>
        <ThemeToggle />
      </header>
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="crt-panel crt-panel-glow crt-bezel w-full max-w-md p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}

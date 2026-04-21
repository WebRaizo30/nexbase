"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nexbaseConfig } from "@/lib/nexbase-config";
import { useDashboardMe } from "@/components/dashboard/dashboard-session";

const baseLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/api-keys", label: "API keys" },
  { href: "/dashboard/files", label: "Files" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const me = useDashboardMe();
  const isAdmin = me?.role === "admin";

  const links = [
    ...baseLinks.slice(0, 2),
    ...(isAdmin ? ([{ href: "/dashboard/admin", label: "Admin" }] as const) : []),
    ...baseLinks.slice(2),
  ];

  return (
    <aside className="flex w-full flex-col border-b border-crt-border bg-crt-panel/50 backdrop-blur-md md:w-60 md:border-b-0 md:border-r">
      <div className="crt-divider" />
      <div className="px-4 py-5">
        <p className="font-display text-lg font-extrabold tracking-tight text-phosphor-bright [text-shadow:0_0_18px_var(--crt-glow)]">
          {nexbaseConfig.appName}
        </p>
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-crt-muted">Control panel</p>
        {me?.role ? (
          <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-widest text-crt-muted">
            Role · <span className="text-phosphor-bright">{me.role}</span>
          </p>
        ) : null}
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-3 md:pb-6">
        {(me === undefined ? baseLinks : links).map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-sm px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition ${
                active
                  ? "crt-panel crt-panel-glow border border-phosphor/35 text-phosphor-bright shadow-glow"
                  : "text-crt-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
              }`}
            >
              {active ? "› " : "  "}
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

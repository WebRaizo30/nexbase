"use client";

import { useRouter } from "next/navigation";
import { clearAuthToken } from "@/lib/auth";
import { apiJson } from "@/lib/api";
import { DashboardSessionProvider } from "@/components/dashboard/dashboard-session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    try {
      await apiJson("/api/auth/logout", { method: "POST" });
    } catch {
      /* still clear local session */
    }
    clearAuthToken();
    router.replace("/login");
    router.refresh();
  }

  return (
    <DashboardSessionProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-end gap-3 border-b border-crt-border bg-crt-panel/40 px-4 py-3 backdrop-blur-sm">
            <span className="crt-badge mr-auto hidden sm:inline-flex">SYS · ONLINE</span>
            <ThemeToggle />
            <button type="button" onClick={() => void logout()} className="crt-btn-ghost py-2 text-xs">
              Log out
            </button>
          </div>
          <main className="relative flex-1 p-4 sm:p-8">
            <div className="crt-grid-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden />
            <div className="relative">{children}</div>
          </main>
        </div>
      </div>
    </DashboardSessionProvider>
  );
}

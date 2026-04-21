import { OverviewWidgets } from "@/components/dashboard/overview-widgets";

export default function DashboardHomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="crt-badge mb-4">OVERVIEW</p>
      <h1 className="crt-title text-3xl sm:text-4xl">Dashboard</h1>
      <p className="crt-subtitle mt-4 max-w-2xl text-sm sm:text-base leading-relaxed">
        Live snapshot from your account and the demo metrics feed. Use the sidebar for deeper screens.
      </p>
      <div className="mt-10">
        <OverviewWidgets />
      </div>
    </div>
  );
}

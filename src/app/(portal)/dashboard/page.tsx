import { AppShell } from "@/components/shell/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <AppShell title="Commercial Dashboard">
      <DashboardView />
    </AppShell>
  );
}

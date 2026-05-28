import { AppShell } from "@/components/shell/app-shell";
import { OutletsSettings } from "@/components/settings/outlets-settings";

export default function OutletsSettingsPage() {
  return (
    <AppShell title="Outlets & Registers">
      <OutletsSettings />
    </AppShell>
  );
}

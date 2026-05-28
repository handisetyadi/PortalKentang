import { AppShell } from "@/components/shell/app-shell";
import { CompanySettingsContent } from "./company-settings-content";

export default function CompanySettingsPage() {
  return (
    <AppShell title="Company Settings">
      <CompanySettingsContent />
    </AppShell>
  );
}

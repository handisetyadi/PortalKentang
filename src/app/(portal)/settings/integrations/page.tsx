import { AppShell } from "@/components/shell/app-shell";
import { IntegrationsSettings } from "@/components/settings/integrations-settings";

export default function IntegrationsSettingsPage() {
  return (
    <AppShell title="Integrations">
      <IntegrationsSettings />
    </AppShell>
  );
}

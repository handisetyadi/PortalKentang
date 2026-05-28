import { AppShell } from "@/components/shell/app-shell";
import { PrinterSettingsPanel } from "@/components/settings/printer-settings-panel";

export default function PrinterSettingsPage() {
  return (
    <AppShell title="Printer">
      <PrinterSettingsPanel />
    </AppShell>
  );
}

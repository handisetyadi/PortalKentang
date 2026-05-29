import { AppShell } from "@/components/shell/app-shell";
import { ThermalPrinterSettingsPanel } from "@/components/settings/thermal-printer-settings-panel";

export default function PrinterSettingsPage() {
  return (
    <AppShell title="Printer">
      <ThermalPrinterSettingsPanel />
    </AppShell>
  );
}

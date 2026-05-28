import { AppShell } from "@/components/shell/app-shell";
import { ReceiptSettingsForm } from "@/components/settings/receipt-settings-form";

export default function ReceiptSettingsPage() {
  return (
    <AppShell title="Receipt Settings">
      <ReceiptSettingsForm />
    </AppShell>
  );
}

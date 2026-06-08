import { AppShell } from "@/components/shell/app-shell";
import { LoyaltySettingsForm } from "@/components/settings/loyalty-settings-form";

export default function LoyaltySettingsPage() {
  return (
    <AppShell title="Loyalty Settings">
      <LoyaltySettingsForm />
    </AppShell>
  );
}

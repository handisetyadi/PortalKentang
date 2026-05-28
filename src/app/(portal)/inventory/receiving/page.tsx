import { AppShell } from "@/components/shell/app-shell";
import { ReceivingForm } from "@/components/inventory/receiving-form";

export default function ReceivingPage() {
  return (
    <AppShell title="Purchase Receiving">
      <ReceivingForm />
    </AppShell>
  );
}

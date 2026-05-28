import { AppShell } from "@/components/shell/app-shell";
import { WastageForm } from "@/components/inventory/wastage-form";

export default function WastagePage() {
  return (
    <AppShell title="Wastage">
      <WastageForm />
    </AppShell>
  );
}

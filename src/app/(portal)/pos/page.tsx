import { AppShell } from "@/components/shell/app-shell";
import { PosScreen } from "@/components/pos/pos-screen";

export default function PosPage() {
  return (
    <AppShell title="Point of Sale">
      <PosScreen />
    </AppShell>
  );
}

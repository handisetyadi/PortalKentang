import { AppShell } from "@/components/shell/app-shell";
import { PlaceholderFeature } from "@/components/shared/placeholder-feature";

export default function TransfersPage() {
  return (
    <AppShell title="Stock Transfers">
      <PlaceholderFeature
        title="Transfer between outlets"
        description="Move stock between warehouses and outlets. Form creates transfer_out and transfer_in ledger entries."
      />
    </AppShell>
  );
}

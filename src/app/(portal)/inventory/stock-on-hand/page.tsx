import { AppShell } from "@/components/shell/app-shell";
import { StockOnHandView } from "@/components/inventory/stock-on-hand-view";

export default function StockOnHandPage() {
  return (
    <AppShell title="Stock on Hand">
      <StockOnHandView />
    </AppShell>
  );
}

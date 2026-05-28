import { AppShell } from "@/components/shell/app-shell";
import { StockLedgerView } from "@/components/inventory/stock-ledger-view";

export default function StockLedgerPage() {
  return (
    <AppShell title="Stock Ledger">
      <StockLedgerView />
    </AppShell>
  );
}

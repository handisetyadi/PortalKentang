import { AppShell } from "@/components/shell/app-shell";
import { NewStockCountForm } from "@/components/inventory/new-stock-count-form";

export default function NewStockCountPage() {
  return (
    <AppShell title="New Stock Count">
      <NewStockCountForm />
    </AppShell>
  );
}

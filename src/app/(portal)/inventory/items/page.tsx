import { AppShell } from "@/components/shell/app-shell";
import { InventoryItemsList } from "@/components/inventory/inventory-items-list";

export default function InventoryItemsPage() {
  return (
    <AppShell title="Inventory Items">
      <InventoryItemsList />
    </AppShell>
  );
}

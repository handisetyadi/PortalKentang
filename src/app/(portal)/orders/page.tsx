import { AppShell } from "@/components/shell/app-shell";
import { OrdersList } from "@/components/orders/orders-list";

export default function OrdersPage() {
  return (
    <AppShell title="Orders">
      <OrdersList />
    </AppShell>
  );
}

import { AppShell } from "@/components/shell/app-shell";
import { OrderDetail } from "@/components/orders/order-detail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="Order detail">
      <OrderDetail id={id} />
    </AppShell>
  );
}

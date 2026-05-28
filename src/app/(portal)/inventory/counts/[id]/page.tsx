import { AppShell } from "@/components/shell/app-shell";
import { StockCountDetail } from "@/components/inventory/stock-count-detail";

export default async function StockCountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="Stock Count">
      <StockCountDetail id={id} />
    </AppShell>
  );
}

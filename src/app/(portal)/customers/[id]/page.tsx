import { AppShell } from "@/components/shell/app-shell";
import { CustomerDetail } from "@/components/customers/customer-detail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="Customer">
      <CustomerDetail id={id} />
    </AppShell>
  );
}

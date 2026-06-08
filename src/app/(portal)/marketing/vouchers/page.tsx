import { AppShell } from "@/components/shell/app-shell";
import { VouchersList } from "@/components/marketing/vouchers-list";

export default function MarketingVouchersPage() {
  return (
    <AppShell title="Vouchers">
      <VouchersList />
    </AppShell>
  );
}

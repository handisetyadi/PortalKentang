import { AppShell } from "@/components/shell/app-shell";
import { CustomersList } from "@/components/customers/customers-list";

export default function CustomersPage() {
  return (
    <AppShell title="Customers">
      <CustomersList />
    </AppShell>
  );
}

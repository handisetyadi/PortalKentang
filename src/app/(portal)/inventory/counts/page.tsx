import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { StockCountsList } from "@/components/inventory/stock-counts-list";
import { Button } from "@/components/ui/button";

export default function StockCountsPage() {
  return (
    <AppShell title="Stock Counts">
      <div className="mb-4">
        <Button asChild>
          <Link href="/inventory/counts/new">New stock count</Link>
        </Button>
      </div>
      <StockCountsList />
    </AppShell>
  );
}

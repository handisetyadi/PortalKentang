"use client";

import Link from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/badge";
import type { StockCount } from "@/lib/data/types";

export function StockCountsList() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  const columns: Column<StockCount>[] = [
    {
      key: "id",
      header: "Count",
      cell: (r) => (
        <Link href={`/inventory/counts/${r.id}`} className="hover:underline">
          {r.id.slice(0, 8)}
        </Link>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <Badge>{r.status}</Badge> },
    { key: "items", header: "Lines", cell: (r) => r.items.length },
    {
      key: "date",
      header: "Created",
      cell: (r) => new Date(r.createdAt).toLocaleDateString("id-ID"),
    },
  ];

  return <DataTable columns={columns} data={data.stockCounts} emptyTitle="No stock counts" />;
}

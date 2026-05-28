"use client";

import Link from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Transaction } from "@/lib/data/types";

export function OrdersList() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  const columns: Column<Transaction>[] = [
    {
      key: "receipt",
      header: "Receipt",
      cell: (r) => (
        <Link href={`/orders/${r.id}`} className="font-medium hover:underline">
          {r.receiptNumber}
        </Link>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (r) => formatDateTime(r.createdAt),
    },
    {
      key: "total",
      header: "Total",
      cell: (r) => formatCurrency(r.total),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant="secondary">{r.status}</Badge>,
    },
    {
      key: "sync",
      header: "Sync",
      cell: (r) => (
        <Badge variant={r.syncStatus === "synced" ? "success" : "warning"}>{r.syncStatus}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data.transactions}
      emptyTitle="No orders"
      emptyDescription="Complete a sale in POS to see transactions here."
      searchPlaceholder="Search receipt…"
      searchFilter={(r, q) => r.receiptNumber.toLowerCase().includes(q)}
    />
  );
}

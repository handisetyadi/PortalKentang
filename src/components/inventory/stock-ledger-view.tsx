"use client";

import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import type { StockLedgerEntry } from "@/lib/data/types";

export function StockLedgerView() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  const columns: Column<StockLedgerEntry>[] = [
    {
      key: "date",
      header: "Date",
      cell: (r) => new Date(r.createdAt).toLocaleString("id-ID"),
    },
    {
      key: "item",
      header: "Item",
      cell: (r) => data.inventoryItems.find((i) => i.id === r.inventoryItemId)?.name ?? r.inventoryItemId,
    },
    { key: "type", header: "Movement", cell: (r) => r.movementType },
    {
      key: "qty",
      header: "Qty",
      cell: (r) => `${r.quantityDelta} ${r.unit}`,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data.stockLedger}
      emptyTitle="No movements"
      emptyDescription="Stock changes appear here from sales, receiving, and adjustments."
    />
  );
}

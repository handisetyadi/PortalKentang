"use client";

import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from "@/lib/data/types";

export function InventoryItemsList() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  const columns: Column<InventoryItem>[] = [
    { key: "sku", header: "SKU", cell: (r) => r.sku },
    { key: "name", header: "Name", cell: (r) => r.name },
    {
      key: "type",
      header: "Type",
      cell: (r) => <Badge variant="outline">{r.type.replace(/_/g, " ")}</Badge>,
    },
    { key: "unit", header: "Unit", cell: (r) => r.baseUnit },
    {
      key: "track",
      header: "Track stock",
      cell: (r) => (r.trackStock ? "Yes" : "No"),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data.inventoryItems}
      emptyTitle="No items"
      searchPlaceholder="Search items…"
      searchFilter={(r, q) =>
        r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
      }
    />
  );
}

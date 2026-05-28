"use client";

import { useAppData } from "@/hooks/use-app-data";
import { getAvailableQty } from "@/lib/inventory/fifo";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/badge";
import { IDS } from "@/lib/data/ids";

type Row = { id: string; name: string; sku: string; onHand: number; unit: string; low: boolean };

export function StockOnHandView() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  const rows: Row[] = data.inventoryItems
    .filter((i) => i.trackStock)
    .map((i) => {
      const onHand = getAvailableQty(data, i.id, IDS.outlet1);
      return {
        id: i.id,
        name: i.name,
        sku: i.sku,
        onHand,
        unit: i.baseUnit,
        low: i.reorderPoint != null && onHand < i.reorderPoint,
      };
    });

  const columns: Column<Row>[] = [
    { key: "sku", header: "SKU", cell: (r) => r.sku },
    { key: "name", header: "Item", cell: (r) => r.name },
    {
      key: "qty",
      header: "On hand",
      cell: (r) => (
        <span className={r.low ? "font-medium text-amber-600" : ""}>
          {r.onHand.toFixed(2)} {r.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (r.low ? <Badge variant="warning">Low stock</Badge> : <Badge variant="success">OK</Badge>),
    },
  ];

  return <DataTable columns={columns} data={rows} emptyTitle="No stock tracked" />;
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/lib/data/types";
import { AddInventoryItemDialog } from "./add-inventory-item-dialog";

export function InventoryItemsList() {
  const { data, loading, saveLocal, refresh } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data.inventoryItems}
        emptyTitle="No items"
        searchPlaceholder="Search items…"
        searchFilter={(r, q) =>
          r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
        }
      />

      <AddInventoryItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={data}
        saveLocal={saveLocal}
        refresh={refresh}
      />
    </div>
  );
}

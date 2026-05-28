"use client";

import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/use-app-data";
import { getAvailableQty } from "@/lib/inventory/fifo";
import { IDS } from "@/lib/data/ids";
import { Button } from "@/components/ui/button";

export function NewStockCountForm() {
  const router = useRouter();
  const { data, persist, loading } = useAppData();

  const create = async () => {
    if (!data) return;
    const items = data.inventoryItems
      .filter((i) => i.trackStock)
      .map((i) => ({
        id: crypto.randomUUID(),
        inventoryItemId: i.id,
        inventoryItemName: i.name,
        expectedQuantity: getAvailableQty(data, i.id, IDS.outlet1),
        countedQuantity: getAvailableQty(data, i.id, IDS.outlet1),
      }));
    const count = {
      id: crypto.randomUUID(),
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      status: "draft" as const,
      items,
      createdAt: new Date().toISOString(),
    };
    await persist({ ...data, stockCounts: [count, ...data.stockCounts] });
    router.push(`/inventory/counts/${count.id}`);
  };

  if (loading) return null;

  return (
    <Button onClick={create}>Create count from current stock</Button>
  );
}

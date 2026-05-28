"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppData } from "@/lib/data/types";

export function StockCountDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, persist, loading } = useAppData();
  const [localItems, setLocalItems] = useState<Record<string, number>>({});

  if (loading) return <LoadingState />;
  const count = data?.stockCounts.find((c) => c.id === id);
  if (!count) return <ErrorState message="Stock count not found" />;

  const apply = async () => {
    if (!data) return;
    let next: AppData = { ...data };
    for (const item of count.items) {
      const counted = localItems[item.id] ?? item.countedQuantity;
      const variance = counted - item.expectedQuantity;
      if (variance === 0) continue;
      const ledger = {
        id: crypto.randomUUID(),
        outletId: count.outletId,
        warehouseId: count.warehouseId,
        inventoryItemId: item.inventoryItemId,
        movementType: "stock_count_adjustment" as const,
        quantityDelta: variance,
        unit: "pcs",
        sourceType: "stock_count",
        sourceId: count.id,
        notes: "Physical count adjustment",
        createdAt: new Date().toISOString(),
      };
      next = { ...next, stockLedger: [ledger, ...next.stockLedger] };
    }
    const updatedCounts = next.stockCounts.map((c) =>
      c.id === id ? { ...c, status: "applied" as const, submittedAt: new Date().toISOString() } : c
    );
    await persist({ ...next, stockCounts: updatedCounts });
    router.push("/inventory/counts");
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead>Counted</TableHead>
            <TableHead>Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {count.items.map((item) => {
            const counted = localItems[item.id] ?? item.countedQuantity;
            const variance = counted - item.expectedQuantity;
            return (
              <TableRow key={item.id}>
                <TableCell>{item.inventoryItemName}</TableCell>
                <TableCell>{item.expectedQuantity}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-24"
                    defaultValue={counted}
                    onChange={(e) =>
                      setLocalItems((s) => ({ ...s, [item.id]: Number(e.target.value) }))
                    }
                  />
                </TableCell>
                <TableCell className={variance !== 0 ? "text-amber-600 font-medium" : ""}>
                  {variance > 0 ? "+" : ""}
                  {variance}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {count.status === "draft" && (
        <Button onClick={apply}>Submit & apply adjustment</Button>
      )}
    </div>
  );
}

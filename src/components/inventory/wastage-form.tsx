"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/use-app-data";
import { IDS } from "@/lib/data/ids";
import type { StockLedgerEntry } from "@/lib/data/types";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  reason: z.string().min(1),
});

export function WastageForm() {
  const { data, persist, loading } = useAppData();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { inventoryItemId: "", quantity: 1, reason: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!data) return;
    let next = { ...data };
    const item = data.inventoryItems.find((i) => i.id === values.inventoryItemId);
    const ledger: StockLedgerEntry = {
      id: crypto.randomUUID(),
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      inventoryItemId: values.inventoryItemId,
      movementType: "wastage",
      quantityDelta: -values.quantity,
      unit: item?.baseUnit ?? "pcs",
      sourceType: "wastage",
      sourceId: crypto.randomUUID(),
      notes: values.reason,
      createdAt: new Date().toISOString(),
    };
    const layers = [...next.fifoLayers];
    let rem = values.quantity;
    const sorted = layers
      .filter((l) => l.inventoryItemId === values.inventoryItemId && l.quantityRemaining > 0)
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    for (const layer of sorted) {
      if (rem <= 0) break;
      const idx = layers.findIndex((l) => l.id === layer.id);
      const take = Math.min(rem, layers[idx].quantityRemaining);
      layers[idx] = { ...layers[idx], quantityRemaining: layers[idx].quantityRemaining - take };
      rem -= take;
    }
    next = { ...next, fifoLayers: layers, stockLedger: [ledger, ...next.stockLedger] };
    await persist(next);
    form.reset();
    toast({
      title: "Wastage recorded",
      description: "Stock levels have been updated.",
    });
  };

  if (loading || !data) return null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label>Item</Label>
        <Select onValueChange={(v) => form.setValue("inventoryItemId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {data.inventoryItems.filter((i) => i.trackStock).map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input type="number" {...form.register("quantity")} />
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Textarea {...form.register("reason")} />
      </div>
      <Button type="submit">Record wastage</Button>
    </form>
  );
}

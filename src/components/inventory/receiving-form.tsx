"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/use-app-data";
import { receiveStock } from "@/lib/inventory/fifo";
import { IDS } from "@/lib/data/ids";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0),
  batchCode: z.string().optional(),
  expiresAt: z.string().optional(),
});

export function ReceivingForm() {
  const { data, persist, loading } = useAppData();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { inventoryItemId: "", quantity: 1, unitCost: 0 },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!data) return;
    const next = receiveStock(data, {
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      inventoryItemId: values.inventoryItemId,
      quantity: values.quantity,
      unitCost: values.unitCost,
      batchCode: values.batchCode,
      expiresAt: values.expiresAt || undefined,
    });
    await persist(next);
    form.reset();
    toast({
      title: "Stock received",
      description: "Inventory updated successfully.",
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
            {data.inventoryItems.map((i) => (
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
        <Label>Unit cost</Label>
        <Input type="number" step="0.01" {...form.register("unitCost")} />
      </div>
      <div className="space-y-2">
        <Label>Batch code</Label>
        <Input {...form.register("batchCode")} />
      </div>
      <div className="space-y-2">
        <Label>Expiry (optional)</Label>
        <Input type="date" {...form.register("expiresAt")} />
      </div>
      <Button type="submit">Receive stock</Button>
    </form>
  );
}

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/use-app-data";
import { useCartStore } from "@/stores/cart-store";
import { Label } from "@/components/ui/label";

export function CustomerPicker() {
  const { data } = useAppData();
  const { customerId, setCustomer } = useCartStore();

  if (!data) return null;

  return (
    <div className="space-y-1.5 border-b px-4 py-3">
      <Label className="text-xs text-muted-foreground">Customer</Label>
      <Select
        value={customerId ?? "none"}
        onValueChange={(v) => setCustomer(v === "none" ? undefined : v)}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Walk-in" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Walk-in (no customer)</SelectItem>
          {data.customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` · ${c.phone}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

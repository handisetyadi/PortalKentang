"use client";

import { useAppData } from "@/hooks/use-app-data";
import { useCartStore } from "@/stores/cart-store";
import type { CartLine } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface HeldPayload {
  lines: CartLine[];
  customerId?: string;
}

export function HeldOrdersPanel() {
  const { data, persist } = useAppData();
  const loadHeld = useCartStore((s) => s.loadHeld);

  if (!data || data.heldOrders.length === 0) return null;

  const restore = async (heldId: string) => {
    const held = data.heldOrders.find((h) => h.id === heldId);
    if (!held) return;
    const payload = held.payload as HeldPayload;
    loadHeld(payload.lines ?? [], payload.customerId);
    await persist({
      ...data,
      heldOrders: data.heldOrders.filter((h) => h.id !== heldId),
    });
    toast({ title: "Order restored", description: held.label ?? "Held order loaded into cart." });
  };

  return (
    <div className="border-b px-4 py-2">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Held orders</p>
      <div className="space-y-1">
        {data.heldOrders.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{h.label ?? h.id}</span>
            <Button size="sm" variant="outline" onClick={() => restore(h.id)}>
              Restore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

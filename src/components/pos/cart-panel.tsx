"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { getLineTotal } from "@/lib/pos/pricing";
import { formatCurrency } from "@/lib/utils";

export function CartPanel() {
  const { lines, cartNote, setCartNote, updateQuantity, removeLine, getSubtotal, getTaxTotal, getTotal } =
    useCartStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-auto p-4">
        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cart is empty</p>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{line.productName}</p>
                  {line.variantName && (
                    <p className="text-xs text-muted-foreground">{line.variantName}</p>
                  )}
                  {line.modifierNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">+ {line.modifierNames.join(", ")}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${line.productName}`}
                  onClick={() => removeLine(line.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(line.id, line.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{line.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(line.id, line.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-medium">{formatCurrency(getLineTotal(line))}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <Separator />
      <div className="space-y-2 p-4">
        <Input
          placeholder="Cart note"
          value={cartNote ?? ""}
          onChange={(e) => setCartNote(e.target.value)}
        />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(getTaxTotal())}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

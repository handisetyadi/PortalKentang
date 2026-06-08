"use client";

import { useMemo } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/hooks/use-app-data";
import { toast } from "@/hooks/use-toast";
import { IDS } from "@/lib/data/ids";
import { getLineTotal } from "@/lib/pos/pricing";
import { validateCartStock } from "@/lib/pos/stock-availability";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { usePosSessionStore } from "@/stores/pos-session-store";
import { applyPromotions } from "@/lib/marketing/apply-promotions";
import { canRedeemPoints } from "@/lib/marketing/loyalty-eligibility";

export function CartPanel() {
  const { data } = useAppData();
  const { activeSession } = usePosSessionStore();
  const outletId = activeSession?.outletId ?? IDS.outlet1;
  const {
    lines,
    customerId,
    cartNote,
    redeemPoints,
    voucherCode,
    setCartNote,
    setRedeemPoints,
    updateQuantity,
    removeLine,
  } = useCartStore();

  const customer = customerId ? data?.customers.find((c) => c.id === customerId) : undefined;

  const promo = useMemo(() => {
    if (!data || lines.length === 0) return null;
    return applyPromotions({
      lines,
      customer,
      loyaltyRules: data.loyaltyRules,
      vouchers: data.vouchers,
      categories: data.categories,
      products: data.products,
      loyaltySettings: data.loyaltySettings,
      redeemPoints,
      voucherCode,
    });
  }, [data, lines, customer, redeemPoints, voucherCode]);

  const redeemEligible =
    data &&
    customer &&
    canRedeemPoints({
      lines,
      rules: data.loyaltyRules,
      customer,
      products: data.products,
      categories: data.categories,
    });

  const displayLines = promo?.lines ?? lines;
  const redeemedLineId = promo?.redeemedLineId;

  const handleQuantityChange = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      updateQuantity(lineId, quantity);
      return;
    }
    if (data) {
      const line = lines.find((l) => l.id === lineId);
      const projected = lines.map((l) => (l.id === lineId ? { ...l, quantity } : l));
      const check = validateCartStock(data, projected, outletId, line?.productName);
      if (!check.ok) {
        toast({
          variant: "destructive",
          title: "Stok habis",
          description: check.message,
        });
        return;
      }
    }
    updateQuantity(lineId, quantity);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-auto p-4">
        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cart is empty</p>
        ) : (
          displayLines.map((line) => (
            <div key={line.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{line.productName}</p>
                    {redeemedLineId === line.id && (
                      <Badge variant="secondary" className="text-xs">
                        Redeemed
                      </Badge>
                    )}
                  </div>
                  {line.variantName && (
                    <p className="text-xs text-muted-foreground">{line.variantName}</p>
                  )}
                  {line.modifierNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">+ {line.modifierNames.join(", ")}</p>
                  )}
                  {line.notes && (
                    <p className="text-xs italic text-muted-foreground">&ldquo;{line.notes}&rdquo;</p>
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
                    onClick={() => handleQuantityChange(line.id, line.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{line.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Increase quantity"
                    onClick={() => handleQuantityChange(line.id, line.quantity + 1)}
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
        {customer && lines.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="redeem-points"
              checked={redeemPoints}
              disabled={!redeemEligible}
              onCheckedChange={(v) => setRedeemPoints(v === true)}
            />
            <Label htmlFor="redeem-points" className="text-sm font-normal">
              Redeem member points
              {!redeemEligible && (
                <span className="block text-xs text-muted-foreground">
                  Tidak ada product eligible atau point tidak cukup
                </span>
              )}
            </Label>
          </div>
        )}
        <Input
          placeholder="Cart note"
          value={cartNote ?? ""}
          onChange={(e) => setCartNote(e.target.value)}
        />
        <div className="space-y-1 text-sm">
          {promo && promo.redeemedLineDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Point redemption ({promo.pointsRedeemed} pts)</span>
              <span>-{formatCurrency(promo.redeemedLineDiscount)}</span>
            </div>
          )}
          {promo && promo.voucherDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Voucher {promo.voucherCode}</span>
              <span>-{formatCurrency(promo.voucherDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(promo?.subtotal ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(promo?.taxTotal ?? 0)}</span>
          </div>
          {customer && promo && promo.pointsEarned > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Points earned (est.)</span>
              <span>+{promo.pointsEarned} pts</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(promo?.total ?? 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

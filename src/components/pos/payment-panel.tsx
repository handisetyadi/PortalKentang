"use client";

import { useMemo, useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { useAppData } from "@/hooks/use-app-data";
import { useCartStore } from "@/stores/cart-store";
import { applyPromotions } from "@/lib/marketing/apply-promotions";

const METHODS = ["cash", "qris", "card", "transfer"] as const;

export function PaymentPanel({
  onComplete,
  onHold,
  disabled,
}: {
  onComplete: (method: string) => void;
  onHold: () => void;
  disabled?: boolean;
}) {
  const { data } = useAppData();
  const { lines, customerId, redeemPoints, voucherCode, setVoucherCode } = useCartStore();
  const [method, setMethod] = useState<string>("cash");

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

  const total = promo?.total ?? 0;
  const hasVoucherError = Boolean(promo?.voucherError && voucherCode.trim());

  return (
    <div className="space-y-3 border-t p-4">
      <div className="space-y-2">
        <Label htmlFor="voucher-code">Voucher code</Label>
        <Input
          id="voucher-code"
          placeholder="Masukkan kode voucher"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
        />
        {hasVoucherError && (
          <p className="text-xs text-destructive">{promo?.voucherError}</p>
        )}
      </div>
      <Select value={method} onValueChange={setMethod}>
        <SelectTrigger>
          <SelectValue placeholder="Payment method" />
        </SelectTrigger>
        <SelectContent>
          {METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {m.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        className="w-full"
        size="lg"
        disabled={disabled || total <= 0 || hasVoucherError}
        onClick={() => onComplete(method)}
      >
        Complete sale · {formatCurrency(total)}
      </Button>
      <Button variant="outline" className="w-full" disabled={disabled} onClick={onHold}>
        Hold order
      </Button>
    </div>
  );
}

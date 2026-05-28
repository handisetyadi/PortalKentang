"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const METHODS = ["cash", "qris", "card", "transfer"] as const;

export function PaymentPanel({
  total,
  onComplete,
  onHold,
  disabled,
}: {
  total: number;
  onComplete: (method: string) => void;
  onHold: () => void;
  disabled?: boolean;
}) {
  const [method, setMethod] = useState<string>("cash");

  return (
    <div className="space-y-3 border-t p-4">
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
      <Button className="w-full" size="lg" disabled={disabled || total <= 0} onClick={() => onComplete(method)}>
        Complete sale · {formatCurrency(total)}
      </Button>
      <Button variant="outline" className="w-full" disabled={disabled} onClick={onHold}>
        Hold order
      </Button>
    </div>
  );
}

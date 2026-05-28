"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/data/types";

export function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (product: Product) => void;
}) {
  return (
    <button type="button" onClick={() => onSelect(product)} className="text-left">
      <Card className="h-full transition-shadow hover:shadow-md active:scale-[0.98]">
        <CardContent className="flex flex-col gap-0.5 p-3">
          <span className="font-medium leading-tight">{product.name}</span>
          <span className="text-xs text-muted-foreground">{product.sku}</span>
          <span className="mt-1 text-sm font-semibold text-primary">
            {formatCurrency(product.price)}
          </span>
        </CardContent>
      </Card>
    </button>
  );
}

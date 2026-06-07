"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductCard } from "./product-card";
import { CartPanel } from "./cart-panel";
import { CustomerPicker } from "./customer-picker";
import { HeldOrdersPanel } from "./held-orders-panel";
import { PaymentPanel } from "./payment-panel";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/use-app-data";
import { useCartStore } from "@/stores/cart-store";
import { usePosSessionStore } from "@/stores/pos-session-store";
import { useAuth } from "@/components/providers/auth-provider";
import { completeSale } from "@/lib/pos/complete-sale";
import { buildPaymentsFromCart } from "@/stores/cart-store";
import { enqueueSync } from "@/lib/offline/sync-engine";
import { formatCurrency, generateLocalId } from "@/lib/utils";
import { projectCartAfterAdd } from "@/lib/pos/cart-lines";
import { getCartTotals } from "@/lib/pos/pricing";
import { validateCartStock } from "@/lib/pos/stock-availability";
import type { CartLine } from "@/types/domain";
import { IDS } from "@/lib/data/ids";
import type { Product } from "@/lib/data/types";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaleInvoiceDialog } from "./sale-invoice-dialog";
import { defaultReceiptSettings } from "@/lib/pos/default-receipt-settings";
import type { Customer, Transaction } from "@/lib/data/types";

export function PosScreen() {
  const { data, persist, persistSale, loading } = useAppData();
  const { session } = useAuth();
  const { lines, addLine, clear, getTotal, customerId, cartNote } = useCartStore();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [pickerLineNote, setPickerLineNote] = useState("");
  const [pickerQuantity, setPickerQuantity] = useState("1");
  const [completedSale, setCompletedSale] = useState<{
    transaction: Transaction;
    customer?: Customer;
  } | null>(null);

  const openSession = useMemo(() => {
    if (!data) return null;
    return data.posSessions.find((s) => s.status === "open") ?? null;
  }, [data]);

  useEffect(() => {
    if (openSession) usePosSessionStore.getState().setActiveSession(openSession);
  }, [openSession]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      if (!p.isActive) return false;
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode?.includes(q) ?? false)
      );
    });
  }, [data, categoryId, search]);

  const parsedPickerQuantity = useMemo(() => {
    const n = Math.floor(Number(pickerQuantity));
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [pickerQuantity]);

  const pickerPreviewLine = useMemo((): CartLine | null => {
    if (!pickerProduct || !data) return null;
    const variant = data.variants.find((v) => v.id === selectedVariant);
    const modifierPriceTotal = selectedModifiers.reduce((sum, id) => {
      const m = data.modifiers.find((x) => x.id === id);
      return sum + (m?.priceDelta ?? 0);
    }, 0);
    return {
      id: "preview",
      productId: pickerProduct.id,
      productName: pickerProduct.name,
      variantId: variant?.id,
      variantName: variant?.name,
      modifierIds: selectedModifiers,
      modifierNames: [],
      quantity: parsedPickerQuantity,
      unitPrice: pickerProduct.price + (variant?.priceDelta ?? 0),
      modifierPriceTotal,
      discountAmount: 0,
      taxRate: pickerProduct.taxRate,
    };
  }, [pickerProduct, data, selectedVariant, selectedModifiers, parsedPickerQuantity]);

  const modifierPriceTotal = (modifierIds: string[]) =>
    modifierIds.reduce((sum, id) => {
      const m = data?.modifiers.find((x) => x.id === id);
      return sum + (m?.priceDelta ?? 0);
    }, 0);

  const closePicker = () => {
    setPickerProduct(null);
    setPickerLineNote("");
    setPickerQuantity("1");
    setSelectedVariant(undefined);
    setSelectedModifiers([]);
  };

  const tryAddLine = (incoming: Omit<CartLine, "id">): boolean => {
    if (!data || !openSession) return false;
    const projected = projectCartAfterAdd(lines, incoming);
    const check = validateCartStock(
      data,
      projected,
      openSession.outletId,
      incoming.productName
    );
    if (!check.ok) {
      toast({
        variant: "destructive",
        title: "Stok habis",
        description: check.message,
      });
      return false;
    }
    addLine(incoming);
    return true;
  };

  const handleProductSelect = (product: Product) => {
    const groups = data?.modifierGroups.filter((g) => g.productIds.includes(product.id)) ?? [];
    const productVariants = data?.variants.filter((v) => v.productId === product.id && v.isActive) ?? [];
    if (groups.length > 0 || productVariants.length > 0) {
      setPickerProduct(product);
      setSelectedVariant(productVariants[0]?.id);
      setSelectedModifiers([]);
      setPickerLineNote("");
      setPickerQuantity("1");
      return;
    }
    const recipe = data?.recipes.find((r) => r.productId === product.id && r.isActive);
    tryAddLine({
      productId: product.id,
      productName: product.name,
      modifierIds: [],
      modifierNames: [],
      quantity: 1,
      unitPrice: product.price,
      modifierPriceTotal: 0,
      discountAmount: 0,
      taxRate: product.taxRate,
      recipeId: recipe?.id,
      recipeVersion: recipe?.version,
    });
  };

  const confirmPicker = () => {
    if (!pickerProduct || !data) return;
    const quantity = Math.floor(Number(pickerQuantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      toast({
        variant: "destructive",
        title: "Jumlah tidak valid",
        description: "Masukkan jumlah minimal 1.",
      });
      return;
    }
    const variant = data.variants.find((v) => v.id === selectedVariant);
    const modNames = selectedModifiers
      .map((id) => data.modifiers.find((m) => m.id === id)?.name)
      .filter(Boolean) as string[];
    const recipe = data.recipes.find(
      (r) => r.productId === pickerProduct.id && r.isActive
    );
    if (
      tryAddLine({
        productId: pickerProduct.id,
        productName: pickerProduct.name,
        variantId: variant?.id,
        variantName: variant?.name,
        modifierIds: selectedModifiers,
        modifierNames: modNames,
        quantity,
        unitPrice: pickerProduct.price + (variant?.priceDelta ?? 0),
        modifierPriceTotal: modifierPriceTotal(selectedModifiers),
        discountAmount: 0,
        taxRate: pickerProduct.taxRate,
        recipeId: recipe?.id,
        recipeVersion: recipe?.version,
        notes: pickerLineNote.trim() || undefined,
      })
    ) {
      closePicker();
    }
  };

  const handleComplete = async (method: string) => {
    if (!data || !openSession || !session) {
      toast({
        variant: "destructive",
        title: "Cannot complete sale",
        description: "POS session or catalog data is not available.",
      });
      return;
    }

    const stockCheck = validateCartStock(data, lines, openSession.outletId);
    if (!stockCheck.ok) {
      toast({
        variant: "destructive",
        title: "Stok tidak mencukupi",
        description: stockCheck.message,
      });
      return;
    }

    try {
      const total = getTotal();
      const payments = buildPaymentsFromCart(total, method);
      const localId = generateLocalId(IDS.outlet1);
      const offline = !navigator.onLine;

      const { data: next, transaction } = completeSale({
        data,
        outletId: openSession.outletId,
        sessionId: openSession.id,
        cashierId: session.userId,
        lines,
        payments,
        customerId,
        cartNote,
        localId: offline ? localId : undefined,
        syncStatus: offline ? "pending" : "synced",
      });

      await persistSale(next, transaction);
      if (offline) await enqueueSync("transaction", { localId, transaction });
      const saleCustomer = customerId
        ? next.customers.find((c) => c.id === customerId)
        : undefined;
      clear();
      setCompletedSale({ transaction, customer: saleCustomer });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save the sale.";
      toast({
        variant: "destructive",
        title: "Sale failed to save",
        description: message,
      });
    }
  };

  const handleHold = async () => {
    if (!data || lines.length === 0) return;
    const held = {
      id: crypto.randomUUID(),
      outletId: IDS.outlet1,
      label: `Held ${new Date().toLocaleTimeString()}`,
      payload: { lines, customerId },
      createdAt: new Date().toISOString(),
    };
    await persist({ ...data, heldOrders: [held, ...data.heldOrders] });
    clear();
    toast({ title: "Order held", description: held.label });
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading POS catalog…</div>;
  }

  if (!openSession) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Alert className="max-w-md">
          <AlertDescription>No open POS session. Open a session before selling.</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/pos/open-session">Open session</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:flex-row">
      <div className="flex flex-1 flex-col border-r">
        <div className="space-y-3 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search or scan barcode"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredProducts[0]) handleProductSelect(filteredProducts[0]);
              }}
            />
          </div>
          <Tabs value={categoryId} onValueChange={setCategoryId}>
            <TabsList className="flex h-auto flex-wrap gap-1">
              <TabsTrigger value="all">All</TabsTrigger>
              {data.categories.map((c) => (
                <TabsTrigger key={c.id} value={c.id}>
                  {c.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto p-4 md:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={handleProductSelect} />
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col border-l lg:w-96">
        <HeldOrdersPanel />
        <CustomerPicker />
        <CartPanel />
        <PaymentPanel
          total={getTotal()}
          onComplete={handleComplete}
          onHold={handleHold}
          disabled={lines.length === 0}
        />
      </div>

      <Dialog open={!!pickerProduct} onOpenChange={(open) => !open && closePicker()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pickerProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {data.variants.filter((v) => v.productId === pickerProduct?.id).length > 0 && (
              <div className="space-y-2">
                <Label>Variant</Label>
                {data.variants
                  .filter((v) => v.productId === pickerProduct?.id)
                  .map((v) => (
                    <Button
                      key={v.id}
                      variant={selectedVariant === v.id ? "default" : "outline"}
                      className="mr-2"
                      onClick={() => setSelectedVariant(v.id)}
                    >
                      {v.name}
                    </Button>
                  ))}
              </div>
            )}
            {data.modifierGroups
              .filter((g) => g.productIds.includes(pickerProduct?.id ?? ""))
              .map((g) => (
                <div key={g.id} className="space-y-2">
                  <Label>{g.name}</Label>
                  {data.modifiers
                    .filter((m) => m.groupId === g.id)
                    .map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <Checkbox
                          id={m.id}
                          checked={selectedModifiers.includes(m.id)}
                          onCheckedChange={(checked) => {
                            setSelectedModifiers((prev) =>
                              checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)
                            );
                          }}
                        />
                        <label htmlFor={m.id} className="text-sm">
                          {m.name} (+{formatCurrency(m.priceDelta)})
                        </label>
                      </div>
                    ))}
                </div>
              ))}
            <div className="space-y-2">
              <Label htmlFor="picker-quantity">Jumlah</Label>
              <Input
                id="picker-quantity"
                type="number"
                min={1}
                inputMode="numeric"
                value={pickerQuantity}
                onChange={(e) => setPickerQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="picker-line-note">Catatan</Label>
              <Input
                id="picker-line-note"
                placeholder="Opsional, max 50 karakter"
                value={pickerLineNote}
                maxLength={50}
                onChange={(e) => setPickerLineNote(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{pickerLineNote.length}/50</p>
            </div>
            {pickerPreviewLine && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                {(() => {
                  const t = getCartTotals([pickerPreviewLine]);
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(t.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatCurrency(t.taxTotal)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(t.total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <Button className="w-full" onClick={confirmPicker}>
              Add to cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {completedSale && data && (
        <SaleInvoiceDialog
          open={!!completedSale}
          onOpenChange={(open) => {
            if (!open) setCompletedSale(null);
          }}
          transaction={completedSale.transaction}
          customer={completedSale.customer}
          receiptSettings={data.receiptSettings ?? defaultReceiptSettings(data.company.name)}
        />
      )}
    </div>
  );
}

import type { AppData, FifoCostLayer, StockLedgerEntry } from "@/lib/data/types";

export function getAvailableQty(
  data: AppData,
  inventoryItemId: string,
  outletId: string
): number {
  const now = Date.now();
  return data.fifoLayers
    .filter(
      (l) =>
        l.inventoryItemId === inventoryItemId &&
        l.outletId === outletId &&
        l.quantityRemaining > 0 &&
        (!l.expiresAt || new Date(l.expiresAt).getTime() > now)
    )
    .reduce((s, l) => s + l.quantityRemaining, 0);
}

export function consumeStockForSale(
  data: AppData,
  params: {
    outletId: string;
    warehouseId: string;
    productId: string;
    variantId?: string;
    modifierIds: string[];
    quantity: number;
    transactionItemId: string;
  }
): { data: AppData; cogs: number } {
  const product = data.products.find((p) => p.id === params.productId);
  if (!product?.isRecipeBased) {
    const inv = data.inventoryItems.find((i) => i.sku === product?.sku);
    if (!inv?.trackStock) return { data, cogs: 0 };
    return consumeItem(data, {
      inventoryItemId: inv.id,
      outletId: params.outletId,
      warehouseId: params.warehouseId,
      qty: params.quantity,
      sourceType: "transaction_item",
      sourceId: params.transactionItemId,
    });
  }

  const recipe = data.recipes.find(
    (r) => r.productId === params.productId && r.isActive
  );
  if (!recipe) return { data, cogs: 0 };

  let next = { ...data };
  let totalCogs = 0;
  const items = data.recipeItems.filter((ri) => ri.recipeId === recipe.id);

  for (const ri of items) {
    if (ri.modifierId && !params.modifierIds.includes(ri.modifierId)) continue;
    const qty =
      ri.quantity *
      params.quantity *
      recipe.yieldFactor *
      (1 + recipe.wasteFactor);
    const result = consumeItem(next, {
      inventoryItemId: ri.inventoryItemId,
      outletId: params.outletId,
      warehouseId: params.warehouseId,
      qty,
      sourceType: "transaction_item",
      sourceId: params.transactionItemId,
    });
    next = result.data;
    totalCogs += result.cogs;
  }

  return { data: next, cogs: totalCogs };
}

function consumeItem(
  data: AppData,
  params: {
    inventoryItemId: string;
    outletId: string;
    warehouseId: string;
    qty: number;
    sourceType: string;
    sourceId: string;
  }
): { data: AppData; cogs: number } {
  let remaining = params.qty;
  let cogs = 0;
  const layers = [...data.fifoLayers]
    .filter(
      (l) =>
        l.inventoryItemId === params.inventoryItemId &&
        l.outletId === params.outletId &&
        l.quantityRemaining > 0
    )
    .sort(
      (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    );

  const ledger: StockLedgerEntry[] = [];
  const updatedLayers: FifoCostLayer[] = data.fifoLayers.map((l) => ({ ...l }));

  for (const layer of layers) {
    if (remaining <= 0) break;
    const idx = updatedLayers.findIndex((x) => x.id === layer.id);
    if (idx < 0) continue;
    const take = Math.min(remaining, updatedLayers[idx].quantityRemaining);
    updatedLayers[idx].quantityRemaining -= take;
    cogs += take * updatedLayers[idx].unitCost;
    remaining -= take;
    ledger.push({
      id: crypto.randomUUID(),
      outletId: params.outletId,
      warehouseId: params.warehouseId,
      inventoryItemId: params.inventoryItemId,
      movementType: "sale_consumption",
      quantityDelta: -take,
      unit: data.inventoryItems.find((i) => i.id === params.inventoryItemId)?.baseUnit ?? "pcs",
      unitCost: updatedLayers[idx].unitCost,
      totalCost: take * updatedLayers[idx].unitCost,
      fifoCostLayerId: layer.id,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    data: {
      ...data,
      fifoLayers: updatedLayers,
      stockLedger: [...ledger, ...data.stockLedger],
    },
    cogs,
  };
}

export function receiveStock(
  data: AppData,
  params: {
    outletId: string;
    warehouseId: string;
    inventoryItemId: string;
    quantity: number;
    unitCost: number;
    batchCode?: string;
    expiresAt?: string;
  }
): AppData {
  const layer: FifoCostLayer = {
    id: crypto.randomUUID(),
    outletId: params.outletId,
    warehouseId: params.warehouseId,
    inventoryItemId: params.inventoryItemId,
    batchCode: params.batchCode,
    quantityReceived: params.quantity,
    quantityRemaining: params.quantity,
    unitCost: params.unitCost,
    receivedAt: new Date().toISOString(),
    expiresAt: params.expiresAt,
  };

  const item = data.inventoryItems.find((i) => i.id === params.inventoryItemId);
  const ledger: StockLedgerEntry = {
    id: crypto.randomUUID(),
    outletId: params.outletId,
    warehouseId: params.warehouseId,
    inventoryItemId: params.inventoryItemId,
    movementType: "purchase_receipt",
    quantityDelta: params.quantity,
    unit: item?.baseUnit ?? "pcs",
    unitCost: params.unitCost,
    totalCost: params.quantity * params.unitCost,
    batchCode: params.batchCode,
    expiresAt: params.expiresAt,
    sourceType: "fifo_layer",
    sourceId: layer.id,
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    fifoLayers: [layer, ...data.fifoLayers],
    stockLedger: [ledger, ...data.stockLedger],
  };
}

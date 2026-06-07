import type { AppData, StockLedgerEntry } from "@/lib/data/types";
import { getAvailableQty } from "./fifo";

const EPSILON = 0.000_001;

export type StockAdjustmentChange = {
  inventoryItemId: string;
  newQuantity: number;
};

export class InsufficientStockError extends Error {
  constructor(
    public readonly itemName: string,
    public readonly requestedReduction: number,
    public readonly available: number
  ) {
    super(`Insufficient stock for ${itemName}: need ${requestedReduction}, have ${available}`);
    this.name = "InsufficientStockError";
  }
}

function weightedAvgUnitCost(
  data: AppData,
  inventoryItemId: string,
  outletId: string
): number {
  const layers = data.fifoLayers.filter(
    (l) =>
      l.inventoryItemId === inventoryItemId &&
      l.outletId === outletId &&
      l.quantityRemaining > 0
  );
  if (layers.length === 0) return 0;
  const totalQty = layers.reduce((s, l) => s + l.quantityRemaining, 0);
  if (totalQty <= 0) return 0;
  const totalCost = layers.reduce((s, l) => s + l.quantityRemaining * l.unitCost, 0);
  return totalCost / totalQty;
}

export function applyManualStockAdjustment(
  data: AppData,
  params: {
    outletId: string;
    warehouseId: string;
    inventoryItemId: string;
    newQuantity: number;
    adjustedByName: string;
  }
): AppData {
  const item = data.inventoryItems.find((i) => i.id === params.inventoryItemId);
  if (!item?.trackStock) {
    throw new Error("Item does not track stock");
  }
  if (params.newQuantity < 0) {
    throw new Error("Quantity cannot be negative");
  }

  const currentOnHand = getAvailableQty(data, params.inventoryItemId, params.outletId);
  const delta = params.newQuantity - currentOnHand;
  if (Math.abs(delta) < EPSILON) return data;

  if (delta < 0 && -delta > currentOnHand + EPSILON) {
    throw new InsufficientStockError(item.name, -delta, currentOnHand);
  }

  const sourceId = crypto.randomUUID();
  const notes = `Stock adjustment by ${params.adjustedByName.trim()}`;
  const unit = item.baseUnit;

  if (delta > 0) {
    const unitCost = weightedAvgUnitCost(data, params.inventoryItemId, params.outletId);
    const layerId = crypto.randomUUID();
    const ledger: StockLedgerEntry = {
      id: crypto.randomUUID(),
      outletId: params.outletId,
      warehouseId: params.warehouseId,
      inventoryItemId: params.inventoryItemId,
      movementType: "manual_adjustment",
      quantityDelta: delta,
      unit,
      unitCost,
      totalCost: delta * unitCost,
      fifoCostLayerId: layerId,
      sourceType: "manual_adjustment",
      sourceId,
      notes,
      createdAt: new Date().toISOString(),
    };

    return {
      ...data,
      fifoLayers: [
        {
          id: layerId,
          outletId: params.outletId,
          warehouseId: params.warehouseId,
          inventoryItemId: params.inventoryItemId,
          batchCode: `ADJ-${sourceId.slice(0, 8)}`,
          quantityReceived: delta,
          quantityRemaining: delta,
          unitCost,
          receivedAt: new Date().toISOString(),
        },
        ...data.fifoLayers,
      ],
      stockLedger: [ledger, ...data.stockLedger],
    };
  }

  let remaining = -delta;
  const layers = [...data.fifoLayers];
  const sorted = layers
    .filter(
      (l) =>
        l.inventoryItemId === params.inventoryItemId &&
        l.outletId === params.outletId &&
        l.quantityRemaining > 0
    )
    .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

  const available = sorted.reduce((s, l) => s + l.quantityRemaining, 0);
  if (remaining > available + EPSILON) {
    throw new InsufficientStockError(item.name, remaining, available);
  }

  for (const layer of sorted) {
    if (remaining <= EPSILON) break;
    const idx = layers.findIndex((l) => l.id === layer.id);
    if (idx < 0) continue;
    const take = Math.min(remaining, layers[idx].quantityRemaining);
    layers[idx] = {
      ...layers[idx],
      quantityRemaining: layers[idx].quantityRemaining - take,
    };
    remaining -= take;
  }

  const ledger: StockLedgerEntry = {
    id: crypto.randomUUID(),
    outletId: params.outletId,
    warehouseId: params.warehouseId,
    inventoryItemId: params.inventoryItemId,
    movementType: "manual_adjustment",
    quantityDelta: delta,
    unit,
    sourceType: "manual_adjustment",
    sourceId,
    notes,
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    fifoLayers: layers,
    stockLedger: [ledger, ...data.stockLedger],
  };
}

export function applyManualStockAdjustments(
  data: AppData,
  params: {
    outletId: string;
    warehouseId: string;
    changes: StockAdjustmentChange[];
    adjustedByName: string;
  }
): AppData {
  let next = data;
  for (const change of params.changes) {
    next = applyManualStockAdjustment(next, {
      outletId: params.outletId,
      warehouseId: params.warehouseId,
      inventoryItemId: change.inventoryItemId,
      newQuantity: change.newQuantity,
      adjustedByName: params.adjustedByName,
    });
  }
  return next;
}

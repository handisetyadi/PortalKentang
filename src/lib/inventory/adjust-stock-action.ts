"use server";

import type { AppData } from "@/lib/data/types";
import { requireSession, sessionHasAnyRole, sessionHasPermission } from "@/lib/auth/session";
import {
  applyManualStockAdjustments,
  type StockAdjustmentChange,
  InsufficientStockError,
} from "./manual-stock-adjustment";

export type AdjustStockResult =
  | { ok: true; fifoLayers: AppData["fifoLayers"]; stockLedger: AppData["stockLedger"] }
  | { ok: false; message: string };

export async function adjustStockAction(
  data: AppData,
  params: {
    outletId: string;
    warehouseId: string;
    changes: StockAdjustmentChange[];
  }
): Promise<AdjustStockResult> {
  const session = await requireSession();

  const allowed =
    sessionHasAnyRole(session, ["company_owner", "store_manager"]) ||
    sessionHasPermission(session, "inventory.stock.adjust");

  if (!allowed) {
    return { ok: false, message: "You do not have permission to adjust stock." };
  }

  if (!params.changes.length) {
    return { ok: false, message: "No stock changes to save." };
  }

  for (const change of params.changes) {
    const item = data.inventoryItems.find((i) => i.id === change.inventoryItemId);
    if (!item) {
      return { ok: false, message: "Inventory item not found." };
    }
    if (!item.trackStock) {
      return { ok: false, message: `${item.name} does not track stock.` };
    }
    if (change.newQuantity < 0 || !Number.isFinite(change.newQuantity)) {
      return { ok: false, message: `Invalid quantity for ${item.name}.` };
    }
  }

  try {
    const next = applyManualStockAdjustments(data, {
      outletId: params.outletId,
      warehouseId: params.warehouseId,
      changes: params.changes,
      adjustedByName: session.fullName || session.username,
    });

    return {
      ok: true,
      fifoLayers: next.fifoLayers,
      stockLedger: next.stockLedger,
    };
  } catch (e) {
    if (e instanceof InsufficientStockError) {
      return { ok: false, message: e.message };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Stock adjustment failed.",
    };
  }
}

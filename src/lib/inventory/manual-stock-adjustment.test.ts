import { describe, expect, it } from "vitest";
import { createMockSeed } from "@/lib/data/mock-seed";
import { IDS } from "@/lib/data/ids";
import { getAvailableQty } from "./fifo";
import {
  applyManualStockAdjustment,
  applyManualStockAdjustments,
  InsufficientStockError,
} from "./manual-stock-adjustment";

describe("applyManualStockAdjustment", () => {
  const outletId = IDS.outlet1;
  const warehouseId = IDS.warehouse1;

  it("increases on-hand and writes manual_adjustment ledger", () => {
    const data = createMockSeed();
    const item = data.inventoryItems.find((i) => i.sku === "FG-001")!;
    const before = getAvailableQty(data, item.id, outletId);

    const next = applyManualStockAdjustment(data, {
      outletId,
      warehouseId,
      inventoryItemId: item.id,
      newQuantity: before + 5,
      adjustedByName: "Test Manager",
    });

    expect(getAvailableQty(next, item.id, outletId)).toBeCloseTo(before + 5);
    const entry = next.stockLedger.find((e) => e.notes?.includes("Test Manager"));
    expect(entry?.movementType).toBe("manual_adjustment");
    expect(entry?.quantityDelta).toBeCloseTo(5);
    expect(entry?.notes).toBe("Stock adjustment by Test Manager");
  });

  it("decreases on-hand via FIFO layers", () => {
    const data = createMockSeed();
    const item = data.inventoryItems.find((i) => i.sku === "FG-001")!;
    const before = getAvailableQty(data, item.id, outletId);

    const next = applyManualStockAdjustment(data, {
      outletId,
      warehouseId,
      inventoryItemId: item.id,
      newQuantity: before - 2,
      adjustedByName: "Test Manager",
    });

    expect(getAvailableQty(next, item.id, outletId)).toBeCloseTo(before - 2);
    const entry = next.stockLedger[0];
    expect(entry.quantityDelta).toBeCloseTo(-2);
  });

  it("throws InsufficientStockError with descriptive message", () => {
    const err = new InsufficientStockError("Croissant", 10, 3);
    expect(err.message).toContain("Croissant");
    expect(err.message).toContain("10");
    expect(err.message).toContain("3");
  });

  it("skips when quantity unchanged", () => {
    const data = createMockSeed();
    const item = data.inventoryItems.find((i) => i.sku === "FG-001")!;
    const before = getAvailableQty(data, item.id, outletId);

    const next = applyManualStockAdjustment(data, {
      outletId,
      warehouseId,
      inventoryItemId: item.id,
      newQuantity: before,
      adjustedByName: "Test Manager",
    });

    expect(next).toBe(data);
  });

  it("applies batch adjustments", () => {
    const data = createMockSeed();
    const croissant = data.inventoryItems.find((i) => i.sku === "FG-001")!;
    const before = getAvailableQty(data, croissant.id, outletId);

    const next = applyManualStockAdjustments(data, {
      outletId,
      warehouseId,
      adjustedByName: "Batch User",
      changes: [{ inventoryItemId: croissant.id, newQuantity: before + 3 }],
    });

    expect(getAvailableQty(next, croissant.id, outletId)).toBeCloseTo(before + 3);
  });
});

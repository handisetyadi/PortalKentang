import { describe, expect, it } from "vitest";
import { nextInventorySku } from "./inventory-sku";

describe("nextInventorySku", () => {
  it("generates RM-00001 when no raw material SKUs exist", () => {
    expect(nextInventorySku("raw_material", [{ sku: "SF-00001" }])).toBe("RM-00001");
  });

  it("increments raw material SKUs", () => {
    expect(
      nextInventorySku("raw_material", [{ sku: "RM-001" }, { sku: "RM-004" }])
    ).toBe("RM-00005");
  });

  it("delegates semi-finished to SF- prefix with 5 digits", () => {
    expect(nextInventorySku("semi_finished_good", [{ sku: "SF-00003" }])).toBe("SF-00004");
  });

  it("generates FD- SKUs for retail good", () => {
    expect(nextInventorySku("retail_good", [{ sku: "FD-001" }, { sku: "FD-003" }])).toBe(
      "FD-00004"
    );
  });

  it("generates SUP- SKUs for supply", () => {
    expect(nextInventorySku("supply", [{ sku: "SUP-001" }])).toBe("SUP-00002");
  });
});

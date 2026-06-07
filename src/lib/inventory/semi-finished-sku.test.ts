import { describe, expect, it } from "vitest";
import { nextSemiFinishedSku } from "./semi-finished-sku";

describe("nextSemiFinishedSku", () => {
  it("returns SF-00001 when no semi-finished SKUs exist", () => {
    expect(nextSemiFinishedSku([{ sku: "RM-001" }])).toBe("SF-00001");
  });

  it("increments from legacy 3-digit SKUs", () => {
    expect(nextSemiFinishedSku([{ sku: "SF-001" }])).toBe("SF-00002");
  });

  it("increments from 5-digit SKUs", () => {
    expect(
      nextSemiFinishedSku([{ sku: "SF-00001" }, { sku: "SF-00005" }]),
    ).toBe("SF-00006");
  });

  it("is case-insensitive on prefix", () => {
    expect(nextSemiFinishedSku([{ sku: "sf-00003" }])).toBe("SF-00004");
  });
});

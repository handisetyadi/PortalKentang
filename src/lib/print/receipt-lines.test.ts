import { describe, expect, it } from "vitest";
import { padReceiptColumns, receiptCharWidth } from "./receipt-lines";

describe("receipt-lines", () => {
  it("uses 48 columns for 80mm paper", () => {
    expect(receiptCharWidth(80)).toBe(48);
  });

  it("pads currency columns", () => {
    const line = padReceiptColumns("Subtotal", "Rp 26.000", 48);
    expect(line.startsWith("Subtotal")).toBe(true);
    expect(line.endsWith("Rp 26.000")).toBe(true);
    expect(line.length).toBe(48);
  });
});

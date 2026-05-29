import { describe, expect, it } from "vitest";
import { buildReceiptEscPos, charsPerLineForPaper, wrapText } from "./formatter";
import type { PrintPayload } from "../types";

describe("thermal-printer escpos formatter", () => {
  it("uses 32 chars for 58mm", () => {
    expect(charsPerLineForPaper(58)).toBe(32);
    expect(charsPerLineForPaper(80)).toBe(48);
  });

  it("wraps long text", () => {
    const lines = wrapText("hello world from thermal printer", 10);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("includes cut command when autoCut", () => {
    const payload: PrintPayload = {
      type: "receipt",
      title: "Test",
      lines: [{ text: "Line", align: "left" }],
    };
    const out = buildReceiptEscPos(payload, {
      enabled: true,
      connectionType: "android-native-bluetooth",
      paperWidth: 58,
      charsPerLine: 32,
      autoCut: true,
    });
    expect(out.includes("\x1B")).toBe(true);
    expect(out.includes("\x1D")).toBe(true);
  });
});

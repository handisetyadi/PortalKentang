import { describe, expect, it } from "vitest";
import { parsePriceInput } from "./parse-price-input";

describe("parsePriceInput", () => {
  it("returns undefined for empty values", () => {
    expect(parsePriceInput(undefined)).toBeUndefined();
    expect(parsePriceInput("")).toBeUndefined();
    expect(parsePriceInput("   ")).toBeUndefined();
  });

  it("parses plain numbers", () => {
    expect(parsePriceInput("25000")).toBe(25000);
    expect(parsePriceInput(25000)).toBe(25000);
  });

  it("parses Indonesian thousands with dots", () => {
    expect(parsePriceInput("25.000")).toBe(25000);
  });

  it("does not treat empty string as zero", () => {
    expect(parsePriceInput("")).not.toBe(0);
  });
});

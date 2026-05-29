import { describe, expect, it } from "vitest";
import { escPosStringToBytes } from "./escpos-bytes";

describe("escPosStringToBytes", () => {
  it("encodes ESC init as single byte", () => {
    const bytes = escPosStringToBytes("\x1B@");
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
  });

  it("encodes UTF-8 text", () => {
    const bytes = escPosStringToBytes("Kentang");
    expect(new TextDecoder().decode(bytes)).toBe("Kentang");
  });
});

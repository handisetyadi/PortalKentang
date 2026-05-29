/** Standard ESC/POS command builders (generic thermal compatibility). */

export const ESC = "\x1B";
export const GS = "\x1D";

export function cmdInit(): string {
  return `${ESC}@`;
}

export function cmdAlign(mode: "left" | "center" | "right"): string {
  const n = mode === "center" ? "\x01" : mode === "right" ? "\x02" : "\x00";
  return `${ESC}a${n}`;
}

export function cmdBold(on: boolean): string {
  return `${ESC}E${on ? "\x01" : "\x00"}`;
}

export function cmdSize(width: 1 | 2, height: 1 | 2): string {
  const n = (width > 1 ? 0x20 : 0) | (height > 1 ? 0x10 : 0);
  return `${GS}!${String.fromCharCode(n)}`;
}

export function cmdFeed(lines = 1): string {
  return `${ESC}d${String.fromCharCode(Math.min(Math.max(lines, 1), 255))}`;
}

export function cmdCut(partial = false): string {
  return partial ? `${GS}V\x42\x00` : `${GS}V\x41\x03`;
}

/** Kick cash drawer (pin 2) — optional on supported printers. */
export function cmdOpenDrawer(): string {
  return `${ESC}p\x00\x19\xfa`;
}

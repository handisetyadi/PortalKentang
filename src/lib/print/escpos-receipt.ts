import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { buildReceiptLines } from "./receipt-lines";

const ESC = "\x1B";
const GS = "\x1D";

function escInit(): string {
  return `${ESC}@`;
}

function escAlign(mode: "left" | "center" | "right"): string {
  const n = mode === "center" ? "\x01" : mode === "right" ? "\x02" : "\x00";
  return `${ESC}a${n}`;
}

function escBold(on: boolean): string {
  return `${ESC}E${on ? "\x01" : "\x00"}`;
}

function escFeed(lines = 3): string {
  return `${ESC}d${String.fromCharCode(Math.min(lines, 255))}`;
}

function escCut(): string {
  return `${GS}V\x41\x03`;
}

/** ESC/POS command string for thermal printers (Epson, Xprinter, Star, etc.). */
export function formatReceiptEscPos(
  txn: Transaction,
  settings: ReceiptSettings
): string {
  const lines = buildReceiptLines(txn, settings);
  let headerCount = 1;
  if (settings.taxNumber) headerCount += 1;
  headerCount += 1;

  let out = escInit();
  out += escAlign("center");
  for (let i = 0; i < headerCount; i++) {
    const isStore = i === 0;
    const isTitle = i === headerCount - 1;
    if (isStore || isTitle) out += escBold(true);
    out += `${lines[i]}\n`;
    if (isStore || isTitle) out += escBold(false);
  }

  out += escAlign("left");
  for (let i = headerCount; i < lines.length; i++) {
    out += `${lines[i]}\n`;
  }

  out += escFeed(4);
  if (settings.autoCut) {
    out += escCut();
  }

  return out;
}

export function formatReceiptPlainText(
  txn: Transaction,
  settings: ReceiptSettings
): string {
  return `${buildReceiptLines(txn, settings).join("\n")}\n`;
}

import type { PrinterConfig, PrintLine, PrintPayload } from "../types";
import {
  cmdAlign,
  cmdBold,
  cmdFeed,
  cmdInit,
  cmdSize,
} from "./commands";
import { appendCutCommand, appendDrawerCommand } from "./encode";

export function charsPerLineForPaper(paperWidth: 58 | 80): number {
  return paperWidth === 58 ? 32 : 48;
}

export function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word.length > width ? word.slice(0, width) : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function padColumns(left: string, right: string, width: number): string {
  const l = left.trim();
  const r = right.trim();
  const space = width - l.length - r.length;
  if (space >= 1) return l + " ".repeat(space) + r;
  const maxLeft = Math.max(1, width - r.length - 1);
  return `${l.slice(0, maxLeft)} ${r}`;
}

export function centerLine(text: string, width: number): string {
  const t = text.trim();
  if (t.length >= width) return t.slice(0, width);
  const pad = Math.floor((width - t.length) / 2);
  return " ".repeat(pad) + t;
}

export function dividerLine(width: number): string {
  return "-".repeat(width);
}

function appendLine(
  out: string,
  line: PrintLine,
  width: number
): string {
  const text =
    line.text ??
    (line.label !== undefined || line.value !== undefined
      ? padColumns(line.label ?? "", line.value ?? "", width)
      : "");
  if (!text) return out;

  const align = line.align ?? (line.label ? "left" : "left");
  let chunk = cmdAlign(align);
  if (line.bold) chunk += cmdBold(true);
  if ((line.width ?? 1) > 1 || (line.height ?? 1) > 1) {
    chunk += cmdSize(line.width ?? 1, line.height ?? 1);
  }

  const wrapped =
    align === "center"
      ? [centerLine(text, width)]
      : align === "right"
        ? [padColumns("", text, width)]
        : wrapText(text, width);

  for (const w of wrapped) {
    chunk += `${w}\n`;
  }

  if ((line.width ?? 1) > 1 || (line.height ?? 1) > 1) {
    chunk += cmdSize(1, 1);
  }
  if (line.bold) chunk += cmdBold(false);
  return out + chunk;
}

export function buildReceiptEscPos(
  payload: PrintPayload,
  config: PrinterConfig
): string {
  if (payload.type === "raw" && payload.rawText) {
    let raw = cmdInit() + payload.rawText;
    raw = appendDrawerCommand(raw, config.openDrawer);
    return appendCutCommand(raw, config.autoCut);
  }

  const width = config.charsPerLine || charsPerLineForPaper(config.paperWidth);
  let out = cmdInit();

  if (payload.title) {
    out += cmdAlign("center") + cmdBold(true);
    for (const l of wrapText(payload.title, width)) {
      out += `${l}\n`;
    }
    out += cmdBold(false);
  }

  if (payload.orderNumber) {
    out += cmdAlign("left") + `No. ${payload.orderNumber}\n`;
  }

  if (payload.lines?.length) {
    out += cmdAlign("left") + `${dividerLine(width)}\n`;
    for (const line of payload.lines) {
      out = appendLine(out, line, width);
    }
  }

  out += cmdAlign("left") + cmdFeed(4);
  out = appendDrawerCommand(out, config.openDrawer);
  return appendCutCommand(out, config.autoCut);
}

/** Standard test receipt for Woya / Epson / generic ESC/POS. */
export function buildTestPrintPayload(
  storeName = "Kentang Cafe",
  charsPerLine = 32
): PrintPayload {
  const now = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  return {
    type: "receipt",
    title: storeName,
    orderNumber: "TEST-PRINT",
    lines: [
      { text: "Alamat / header toko", align: "center" },
      { text: dividerLine(charsPerLine), align: "left" },
      { text: `Tanggal: ${now}`, align: "left" },
      { label: "Espresso", value: "Rp 26.000" },
      { label: "1 x Croissant", value: "Rp 18.000" },
      { label: "Subtotal", value: "Rp 44.000" },
      { label: "TOTAL", value: "Rp 48.400", bold: true },
      { text: dividerLine(charsPerLine), align: "left" },
      { text: "Test print berhasil", align: "center", bold: true },
      { text: "Terima kasih", align: "center" },
    ],
  };
}

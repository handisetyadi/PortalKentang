import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

export function receiptCharWidth(paperWidthMm: ReceiptSettings["paperWidthMm"]): number {
  return paperWidthMm === 58 ? 32 : 48;
}

export function formatReceiptDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function paymentLabel(method: string): string {
  const m = method.toLowerCase();
  if (m === "cash") return "Tunai";
  if (m === "card") return "Kartu";
  if (m === "qris") return "QRIS";
  return method;
}

/** Two-column line for fixed-width thermal paper. */
export function padReceiptColumns(left: string, right: string, width: number): string {
  const l = left.trim();
  const r = right.trim();
  const space = width - l.length - r.length;
  if (space >= 1) return l + " ".repeat(space) + r;
  const maxLeft = Math.max(1, width - r.length - 1);
  return `${l.slice(0, maxLeft)} ${r}`;
}

export function centerReceiptLine(text: string, width: number): string {
  const t = text.trim();
  if (t.length >= width) return t.slice(0, width);
  const pad = Math.floor((width - t.length) / 2);
  return " ".repeat(pad) + t;
}

export function receiptRule(width: number): string {
  return "-".repeat(width);
}

/** Plain-text receipt body (no ESC/POS control codes). */
export function buildReceiptLines(
  txn: Transaction,
  settings: ReceiptSettings
): string[] {
  const width = receiptCharWidth(settings.paperWidthMm);
  const when = formatReceiptDateTime(txn.completedAt ?? txn.createdAt);
  const lines: string[] = [];

  lines.push(centerReceiptLine(settings.storeName, width));
  if (settings.taxNumber) {
    lines.push(centerReceiptLine(`NPWP: ${settings.taxNumber}`, width));
  }
  lines.push(centerReceiptLine("STRUK / INVOICE", width));
  lines.push(receiptRule(width));
  lines.push(`No. ${txn.receiptNumber}`);
  lines.push(when);
  lines.push(receiptRule(width));

  for (const i of txn.items) {
    const name = i.variantName ? `${i.productName} (${i.variantName})` : i.productName;
    lines.push(name.slice(0, width));
    lines.push(
      padReceiptColumns(
        `${i.quantity} x ${formatCurrency(i.unitPrice)}`,
        formatCurrency(i.lineTotal),
        width
      )
    );
  }

  lines.push(receiptRule(width));
  lines.push(padReceiptColumns("Subtotal", formatCurrency(txn.subtotal), width));
  lines.push(padReceiptColumns("Pajak", formatCurrency(txn.taxTotal), width));
  if (txn.discountTotal > 0) {
    lines.push(padReceiptColumns("Diskon", `-${formatCurrency(txn.discountTotal)}`, width));
  }
  lines.push(padReceiptColumns("TOTAL", formatCurrency(txn.total), width));
  for (const p of txn.payments) {
    lines.push(padReceiptColumns(paymentLabel(p.method), formatCurrency(p.amount), width));
  }
  lines.push(receiptRule(width));
  lines.push(centerReceiptLine(settings.footerText || "Terima kasih", width));
  if (txn.syncStatus !== "synced") {
    lines.push(centerReceiptLine("PENDING SYNC", width));
  }

  return lines;
}

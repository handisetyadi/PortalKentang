import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";
import type { PrintPayload } from "./types";
import { formatReceiptDateTime, paymentLabel, receiptRule } from "@/lib/print/receipt-lines";
import { charsPerLineForPaper } from "./escpos/formatter";

/** Map POS transaction + receipt settings → generic PrintPayload. */
export function transactionToPrintPayload(
  txn: Transaction,
  settings: ReceiptSettings
): PrintPayload {
  const width = charsPerLineForPaper(settings.paperWidthMm);
  const when = formatReceiptDateTime(txn.completedAt ?? txn.createdAt);

  const lines: PrintPayload["lines"] = [
    ...(settings.taxNumber
      ? [{ text: `NPWP: ${settings.taxNumber}`, align: "center" as const }]
      : []),
    { text: "STRUK / INVOICE", align: "center" as const, bold: true },
    { text: receiptRule(width), align: "left" as const },
    { text: `No. ${txn.receiptNumber}`, align: "left" as const },
    { text: when, align: "left" as const },
    { text: receiptRule(width), align: "left" as const },
  ];

  for (const i of txn.items) {
    const name = i.variantName ? `${i.productName} (${i.variantName})` : i.productName;
    lines.push({ text: name.slice(0, width), align: "left" });
    lines.push({
      label: `${i.quantity} x ${formatCurrency(i.unitPrice)}`,
      value: formatCurrency(i.lineTotal),
    });
  }

  lines.push({ text: receiptRule(width), align: "left" });
  lines.push({ label: "Subtotal", value: formatCurrency(txn.subtotal) });
  lines.push({ label: "Pajak", value: formatCurrency(txn.taxTotal) });
  if (txn.discountTotal > 0) {
    lines.push({ label: "Diskon", value: `-${formatCurrency(txn.discountTotal)}` });
  }
  lines.push({ label: "TOTAL", value: formatCurrency(txn.total), bold: true });
  for (const p of txn.payments) {
    lines.push({ label: paymentLabel(p.method), value: formatCurrency(p.amount) });
  }
  lines.push({ text: receiptRule(width), align: "left" });
  lines.push({
    text: settings.footerText || "Terima kasih",
    align: "center",
  });
  if (txn.syncStatus !== "synced") {
    lines.push({ text: "PENDING SYNC", align: "center", bold: true });
  }

  return {
    type: "receipt",
    title: settings.storeName,
    orderNumber: txn.receiptNumber,
    lines,
  };
}

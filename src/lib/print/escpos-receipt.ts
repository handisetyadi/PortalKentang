/**
 * @deprecated Use @/lib/thermal-printer — kept for backward compatibility.
 */
import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { buildReceiptLines } from "./receipt-lines";
import { buildReceiptEscPos as buildPayloadEscPos } from "@/lib/thermal-printer/escpos/formatter";
import { transactionToPrintPayload } from "@/lib/thermal-printer/transaction-payload";
import type { PrinterConfig } from "@/lib/thermal-printer/types";

function toPrinterConfig(settings: ReceiptSettings): PrinterConfig {
  return {
    enabled: true,
    connectionType: "android-native-bluetooth",
    paperWidth: settings.paperWidthMm,
    charsPerLine: settings.paperWidthMm === 58 ? 32 : 48,
    autoCut: settings.autoCut,
    openDrawer: false,
  };
}

export function formatReceiptEscPos(
  txn: Transaction,
  settings: ReceiptSettings
): string {
  return buildPayloadEscPos(transactionToPrintPayload(txn, settings), toPrinterConfig(settings));
}

export function formatReceiptPlainText(
  txn: Transaction,
  settings: ReceiptSettings
): string {
  return `${buildReceiptLines(txn, settings).join("\n")}\n`;
}

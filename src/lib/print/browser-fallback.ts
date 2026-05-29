import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import type { PrintResult, ReceiptPrintAdapter } from "./adapter";
import { formatReceiptPlainText } from "./escpos-receipt";
import { printPlainTextInBrowser } from "./browser-print";

export const browserPrintAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    return {
      ok: true,
      status: "success",
      message: "Browser print ready (plain-text receipt in hidden frame).",
    };
  },

  async getPrinterStatus(): Promise<PrintResult> {
    return this.testPrinter();
  },

  async printReceipt(transaction, receiptSettings): Promise<PrintResult> {
    const plain = formatReceiptPlainText(transaction, receiptSettings);
    return printPlainTextInBrowser(plain, receiptSettings.paperWidthMm);
  },
};

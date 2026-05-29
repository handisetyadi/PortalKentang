import type { PrintResult, ReceiptPrintAdapter } from "./adapter";
import { printHtmlInBrowser } from "./browser-print";

export const browserPrintAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    return {
      ok: true,
      status: "success",
      message: "Browser print ready (no popup — uses hidden print frame).",
    };
  },

  async getPrinterStatus(): Promise<PrintResult> {
    return this.testPrinter();
  },

  async printReceipt(html: string): Promise<PrintResult> {
    return printHtmlInBrowser(html);
  },
};

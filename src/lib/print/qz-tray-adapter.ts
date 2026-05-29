import type { PrintResult, ReceiptPrintAdapter } from "./adapter";
import { getStoredPrintSettings } from "./print-settings";
import { isQzAvailable, listQzPrinters, printHtmlWithQz } from "./qz-client";
import { printHtmlInBrowser } from "./browser-print";

export const qzTrayAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    const available = await isQzAvailable();
    if (!available) {
      return {
        ok: false,
        status: "qz_not_running",
        message: "QZ Tray is not running. Install and start QZ Tray, or use browser print.",
      };
    }
    const printers = await listQzPrinters();
    return {
      ok: true,
      status: "success",
      message:
        printers.length > 0
          ? `QZ Tray connected. Printers: ${printers.join(", ")}`
          : "QZ Tray connected. No printers detected.",
    };
  },

  async getPrinterStatus(): Promise<PrintResult> {
    return this.testPrinter();
  },

  async printReceipt(html: string): Promise<PrintResult> {
    const { printerName } = getStoredPrintSettings();
    const result = await printHtmlWithQz(html, printerName);
    if (result.ok) {
      return { ok: true, status: "success", message: result.message };
    }
    return {
      ok: false,
      status: result.message?.includes("not running") ? "qz_not_running" : "failed",
      message: result.message,
    };
  },
};

export const qzWithBrowserFallbackAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    const qzStatus = await qzTrayAdapter.testPrinter();
    if (qzStatus.ok) return qzStatus;
    return {
      ok: true,
      status: "success",
      message: `${qzStatus.message ?? "QZ Tray unavailable."} Browser print fallback is ready.`,
    };
  },

  async getPrinterStatus(): Promise<PrintResult> {
    return this.testPrinter();
  },

  async printReceipt(html: string): Promise<PrintResult> {
    const settings = getStoredPrintSettings();
    if (settings.useQzTray) {
      const qzResult = await qzTrayAdapter.printReceipt(html);
      if (qzResult.ok) return qzResult;
      const browserResult = printHtmlInBrowser(html);
      if (browserResult.ok) {
        return {
          ok: true,
          status: "success",
          message: `${qzResult.message ?? "QZ unavailable"} — opened browser print dialog instead.`,
        };
      }
      return {
        ok: false,
        status: qzResult.status,
        message: qzResult.message ?? browserResult.message,
      };
    }
    return printHtmlInBrowser(html);
  },
};

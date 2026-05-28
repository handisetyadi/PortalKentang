import type { PrintResult, ReceiptPrintAdapter } from "./adapter";

export const browserPrintAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    return {
      ok: true,
      status: "success",
      message: "Browser print ready. QZ Tray not detected — using window.print fallback.",
    };
  },
  async getPrinterStatus(): Promise<PrintResult> {
    return this.testPrinter();
  },
  async printReceipt(html: string): Promise<PrintResult> {
    if (typeof window === "undefined") {
      return { ok: false, status: "failed", message: "Not in browser" };
    }
    const w = window.open("", "_blank", "width=320,height=600");
    if (!w) {
      return { ok: false, status: "permission_denied", message: "Popup blocked" };
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return { ok: true, status: "success", message: "Print dialog opened" };
  },
};

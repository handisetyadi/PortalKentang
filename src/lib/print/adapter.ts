export type PrintResult = {
  ok: boolean;
  status:
    | "success"
    | "printer_not_found"
    | "qz_not_running"
    | "permission_denied"
    | "failed";
  message?: string;
};

export interface ReceiptPrintAdapter {
  testPrinter(): Promise<PrintResult>;
  getPrinterStatus(): Promise<PrintResult>;
  printReceipt(html: string): Promise<PrintResult>;
}

import { qzWithBrowserFallbackAdapter } from "./qz-tray-adapter";

export function getPrintAdapter(): ReceiptPrintAdapter {
  return qzWithBrowserFallbackAdapter;
}

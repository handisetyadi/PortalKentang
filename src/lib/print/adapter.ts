import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { ThermalPrinterError } from "@/lib/thermal-printer/errors";
import { getThermalPrinterService } from "@/lib/thermal-printer/service";
import { transactionToPrintPayload } from "@/lib/thermal-printer/transaction-payload";

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
  printReceipt(
    transaction: Transaction,
    receiptSettings: ReceiptSettings
  ): Promise<PrintResult>;
}

function mapErrorToResult(e: unknown): PrintResult {
  if (e instanceof ThermalPrinterError) {
    const status =
      e.code === "PERMISSION_DENIED"
        ? "permission_denied"
        : e.code === "PRINTER_NOT_SELECTED" || e.code === "NOT_CONNECTED"
          ? "printer_not_found"
          : e.code === "UNSUPPORTED"
            ? "failed"
            : "failed";
    return { ok: false, status, message: e.message };
  }
  return {
    ok: false,
    status: "failed",
    message: e instanceof Error ? e.message : "Print failed",
  };
}

function statusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Printer ready";
    case "unsupported":
      return "Direct print tidak didukung di environment ini — gunakan app Android.";
    case "permission-required":
      return "Izin Bluetooth diperlukan";
    case "printer-not-selected":
      return "Printer belum dipilih — buka Settings → Printer";
    case "connecting":
      return "Menghubungkan…";
    case "error":
      return "Koneksi printer gagal";
    default:
      return "Thermal printing nonaktif";
  }
}

export const thermalPrintAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    try {
      const service = getThermalPrinterService();
      const config = await service.getConfig();
      if (!config?.enabled) {
        return { ok: false, status: "printer_not_found", message: "Thermal printing belum diaktifkan." };
      }
      await service.testPrint();
      return { ok: true, status: "success", message: "Test print terkirim." };
    } catch (e) {
      return mapErrorToResult(e);
    }
  },

  async getPrinterStatus(): Promise<PrintResult> {
    try {
      const service = getThermalPrinterService();
      const status = await service.getStatus();
      const ok = status === "ready";
      return {
        ok,
        status: ok ? "success" : "printer_not_found",
        message: statusLabel(status),
      };
    } catch (e) {
      return mapErrorToResult(e);
    }
  },

  async printReceipt(transaction, receiptSettings): Promise<PrintResult> {
    try {
      const service = getThermalPrinterService();
      const config = await service.getConfig();
      if (!config?.enabled) {
        return {
          ok: false,
          status: "printer_not_found",
          message: "Aktifkan thermal printing di Settings → Printer.",
        };
      }
      const payload = transactionToPrintPayload(transaction, {
        ...receiptSettings,
        autoCut: receiptSettings.autoCut,
      });
      await service.print(payload);
      return { ok: true, status: "success", message: "Struk dikirim ke printer thermal." };
    } catch (e) {
      return mapErrorToResult(e);
    }
  },
};

export const qzWithBrowserFallbackAdapter = thermalPrintAdapter;

export function getPrintAdapter(): ReceiptPrintAdapter {
  return thermalPrintAdapter;
}

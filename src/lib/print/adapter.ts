import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { formatReceiptHTML } from "@/lib/pos/receipt-html";
import { formatReceiptEscPos, formatReceiptPlainText } from "./escpos-receipt";
import { getStoredPrintSettings } from "./print-settings";
import { printHtmlInBrowser, printPlainTextInBrowser } from "./browser-print";
import { isQzAvailable, printEscPosWithQz } from "./qz-client";
import {
  isWebSerialSupported,
  listGrantedSerialPorts,
  prepareWebSerialForPrint,
  printEscPosViaWebSerial,
} from "./web-serial-client";

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

function browserPlainFallback(
  transaction: Transaction,
  receiptSettings: ReceiptSettings,
  prefix?: string
): PrintResult {
  const plain = formatReceiptPlainText(transaction, receiptSettings);
  const result = printPlainTextInBrowser(plain, receiptSettings.paperWidthMm);
  if (result.ok && prefix) {
    return { ...result, message: `${prefix} ${result.message ?? ""}`.trim() };
  }
  return result;
}

async function printViaQzEscPos(
  transaction: Transaction,
  receiptSettings: ReceiptSettings
): Promise<PrintResult> {
  const { printerName } = getStoredPrintSettings();
  const escPos = formatReceiptEscPos(transaction, receiptSettings);
  const copies = Math.max(1, receiptSettings.copyCount || 1);

  let lastPrinter: string | undefined;
  for (let i = 0; i < copies; i++) {
    const result = await printEscPosWithQz(escPos, printerName);
    if (!result.ok) {
      return {
        ok: false,
        status: result.message?.includes("not running") ? "qz_not_running" : "printer_not_found",
        message: result.message,
      };
    }
    lastPrinter = result.printer;
  }

  return {
    ok: true,
    status: "success",
    message: `ESC/POS sent to ${lastPrinter ?? "printer"}${copies > 1 ? ` (${copies} copies)` : ""}.`,
  };
}

async function printViaWebSerialEscPos(
  transaction: Transaction,
  receiptSettings: ReceiptSettings
): Promise<PrintResult> {
  const { serialBaudRate } = getStoredPrintSettings();
  const escPos = formatReceiptEscPos(transaction, receiptSettings);
  const copies = Math.max(1, receiptSettings.copyCount || 1);

  let lastMessage: string | undefined;
  for (let i = 0; i < copies; i++) {
    const result = await printEscPosViaWebSerial(escPos, {
      baudRate: serialBaudRate,
    });
    if (!result.ok) {
      return {
        ok: false,
        status: result.message?.includes("not supported")
          ? "failed"
          : result.message?.includes("paired")
            ? "printer_not_found"
            : "permission_denied",
        message: result.message,
      };
    }
    lastMessage = result.message;
  }

  return {
    ok: true,
    status: "success",
    message: lastMessage ?? "ESC/POS sent via Web Serial.",
  };
}

export const thermalPrintAdapter: ReceiptPrintAdapter = {
  async testPrinter(): Promise<PrintResult> {
    const stored = getStoredPrintSettings();

    if (stored.printMethod === "web_serial") {
      if (!isWebSerialSupported()) {
        return {
          ok: false,
          status: "failed",
          message: "Web Serial not supported. Use Chrome or Edge.",
        };
      }
      const ports = await listGrantedSerialPorts();
      return {
        ok: ports.length > 0,
        status: ports.length > 0 ? "success" : "printer_not_found",
        message:
          ports.length > 0
            ? `Paired: ${ports.map((p) => p.label).join(", ")} @ ${stored.serialBaudRate} baud`
            : "No paired port yet. Tap “Pair Bluetooth / serial printer”.",
      };
    }

    if (stored.printMethod === "qz") {
      const available = await isQzAvailable();
      if (!available) {
        return {
          ok: false,
          status: "qz_not_running",
          message: "QZ Tray is not running. Start QZ Tray and allow this site.",
        };
      }
      const { listQzPrinters } = await import("./qz-client");
      const printers = await listQzPrinters();
      return {
        ok: printers.length > 0,
        status: printers.length > 0 ? "success" : "printer_not_found",
        message:
          printers.length > 0
            ? `Printers: ${printers.join(", ")}`
            : "QZ connected but no printers listed.",
      };
    }

    return {
      ok: true,
      status: "success",
      message: "Browser print ready (system print dialog).",
    };
  },

  async getPrinterStatus(): Promise<PrintResult> {
    return this.testPrinter();
  },

  async printReceipt(transaction, receiptSettings): Promise<PrintResult> {
    const stored = getStoredPrintSettings();
    const copies = Math.max(1, receiptSettings.copyCount || 1);
    void copies;

    if (stored.printMethod === "web_serial") {
      const prepared = await prepareWebSerialForPrint();
      if (!prepared) {
        return {
          ok: false,
          status: "permission_denied",
          message: "Pairing printer dibatalkan.",
        };
      }

      const serialResult = await printViaWebSerialEscPos(transaction, receiptSettings);
      if (serialResult.ok) return serialResult;

      const fallback = browserPlainFallback(
        transaction,
        receiptSettings,
        `${serialResult.message ?? "Web Serial failed"} —`
      );
      return fallback.ok
        ? fallback
        : { ok: false, status: "failed", message: serialResult.message ?? fallback.message };
    }

    if (stored.printMethod === "qz") {
      const qzAvailable = await isQzAvailable();
      if (qzAvailable) {
        const qzResult = await printViaQzEscPos(transaction, receiptSettings);
        if (qzResult.ok) return qzResult;
      }

      if (isWebSerialSupported()) {
        const serialResult = await printViaWebSerialEscPos(transaction, receiptSettings);
        if (serialResult.ok) {
          return {
            ...serialResult,
            message: `QZ unavailable. ${serialResult.message ?? ""}`.trim(),
          };
        }
      }

      const fallback = browserPlainFallback(
        transaction,
        receiptSettings,
        "QZ unavailable —"
      );
      if (fallback.ok) return fallback;

      const html = formatReceiptHTML(transaction, receiptSettings);
      const browserHtml = printHtmlInBrowser(html);
      return browserHtml.ok
        ? browserHtml
        : { ok: false, status: "failed", message: browserHtml.message ?? "Print failed" };
    }

    return browserPlainFallback(transaction, receiptSettings);
  },
};

/** @deprecated use thermalPrintAdapter */
export const qzWithBrowserFallbackAdapter = thermalPrintAdapter;

export function getPrintAdapter(): ReceiptPrintAdapter {
  return thermalPrintAdapter;
}

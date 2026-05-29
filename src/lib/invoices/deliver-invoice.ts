import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { getPrintAdapter } from "@/lib/print/adapter";
import type { PrintResult } from "@/lib/print/adapter";
import { getStoredPrintSettings } from "@/lib/print/print-settings";
import { prepareWebSerialForPrint } from "@/lib/print/web-serial-client";

export type InvoiceDeliveryPayload = {
  transactionId: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
};

export type PrintInvoiceResult = {
  ok: boolean;
  message?: string;
  pdfUrl?: string;
  storagePath?: string;
  print?: PrintResult;
};

export async function printThermalInvoice(
  transaction: Transaction,
  receiptSettings: ReceiptSettings
): Promise<PrintResult> {
  return getPrintAdapter().printReceipt(transaction, receiptSettings);
}

/** Generate PDF → save to Supabase → open in new tab → print thermal receipt. */
export async function printInvoiceWithPdf(
  transaction: Transaction,
  receiptSettings: ReceiptSettings,
  options?: { customerName?: string }
): Promise<PrintInvoiceResult> {
  const stored = getStoredPrintSettings();
  let serialPrepared = true;
  if (stored.printMethod === "web_serial") {
    serialPrepared = await prepareWebSerialForPrint();
  }

  const pdfTab =
    typeof window !== "undefined"
      ? window.open("about:blank", "_blank", "noopener,noreferrer")
      : null;

  try {
    const res = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction,
        receiptSettings,
        customerName: options?.customerName,
      }),
    });

    const json = (await res.json()) as {
      ok?: boolean;
      message?: string;
      pdfUrl?: string;
      storagePath?: string;
    };

    if (!res.ok || !json.ok || !json.pdfUrl) {
      pdfTab?.close();
      return {
        ok: false,
        message: json.message ?? "Failed to generate or save invoice PDF.",
      };
    }

    if (pdfTab) {
      pdfTab.location.href = json.pdfUrl;
    } else {
      window.open(json.pdfUrl, "_blank", "noopener,noreferrer");
    }

    const print: PrintResult =
      stored.printMethod === "web_serial" && !serialPrepared
        ? {
            ok: false,
            status: "permission_denied",
            message:
              "Pairing printer dibatalkan. PDF tetap dibuka — pair di Settings → Printer lalu cetak lagi.",
          }
        : await printThermalInvoice(transaction, receiptSettings);

    const parts: string[] = ["PDF opened in a new tab."];
    if (print.ok) {
      parts.push(print.message ?? "ESC/POS receipt sent to printer.");
    } else {
      parts.push(
        print.message ??
          "Thermal print failed — pair printer in Settings → Printer or use QZ Tray."
      );
    }

    return {
      ok: true,
      pdfUrl: json.pdfUrl,
      storagePath: json.storagePath,
      print,
      message: parts.join(" "),
    };
  } catch (e) {
    pdfTab?.close();
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Invoice print failed.",
    };
  }
}

export async function sendInvoiceEmail(
  payload: InvoiceDeliveryPayload
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/invoices/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { ok?: boolean; message?: string };
  return {
    ok: Boolean(json.ok),
    message: json.message ?? (res.ok ? "Email queued." : "Email delivery failed."),
  };
}

export async function sendInvoiceWhatsApp(
  payload: InvoiceDeliveryPayload
): Promise<{ ok: boolean; message: string; providerMessageId?: string }> {
  const res = await fetch("/api/invoices/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    message?: string;
    providerMessageId?: string;
  };
  return {
    ok: Boolean(json.ok),
    message: json.message ?? (res.ok ? "WhatsApp message queued." : "WhatsApp delivery failed."),
    providerMessageId: json.providerMessageId,
  };
}

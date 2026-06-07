import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { getPrintAdapter } from "@/lib/print/adapter";
import type { PrintResult } from "@/lib/print/adapter";
import { getThermalPrinterService } from "@/lib/thermal-printer/service";
import {
  WHATSAPP_PDF_URL_EXPIRY_SECONDS,
  buildWhatsAppInvoiceMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  openWhatsAppInvoiceShare,
} from "@/lib/invoices/whatsapp-invoice";

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

export async function ensureInvoicePdfUrl(
  transaction: Transaction,
  receiptSettings: ReceiptSettings,
  options?: { customerName?: string; signedUrlExpiresInSeconds?: number }
): Promise<{ ok: boolean; pdfUrl?: string; storagePath?: string; message?: string }> {
  try {
    const res = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction,
        receiptSettings,
        customerName: options?.customerName,
        signedUrlExpiresInSeconds: options?.signedUrlExpiresInSeconds,
      }),
    });

    const json = (await res.json()) as {
      ok?: boolean;
      message?: string;
      pdfUrl?: string;
      storagePath?: string;
    };

    if (!res.ok || !json.ok || !json.pdfUrl) {
      return {
        ok: false,
        message: json.message ?? "Gagal membuat atau menyimpan invoice PDF.",
      };
    }

    return {
      ok: true,
      pdfUrl: json.pdfUrl,
      storagePath: json.storagePath,
      message: json.message,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Gagal membuat invoice PDF.",
    };
  }
}

export async function printThermalInvoice(
  transaction: Transaction,
  receiptSettings: ReceiptSettings
): Promise<PrintResult> {
  return getPrintAdapter().printReceipt(transaction, receiptSettings);
}

/** Generate PDF → open tab → direct ESC/POS thermal print (no browser print dialog). */
export async function printInvoiceWithPdf(
  transaction: Transaction,
  receiptSettings: ReceiptSettings,
  options?: { customerName?: string }
): Promise<PrintInvoiceResult> {
  const service = getThermalPrinterService();
  const config = await service.getConfig();
  let thermalPrepared = true;
  if (config?.enabled) {
    thermalPrepared = await service.prepareForPrint();
  }

  const pdfTab =
    typeof window !== "undefined"
      ? window.open("about:blank", "_blank", "noopener,noreferrer")
      : null;

  try {
    const pdfResult = await ensureInvoicePdfUrl(transaction, receiptSettings, {
      customerName: options?.customerName,
    });

    if (!pdfResult.ok || !pdfResult.pdfUrl) {
      pdfTab?.close();
      return {
        ok: false,
        message: pdfResult.message ?? "Failed to generate or save invoice PDF.",
      };
    }

    if (pdfTab) {
      pdfTab.location.href = pdfResult.pdfUrl;
    } else {
      window.open(pdfResult.pdfUrl, "_blank", "noopener,noreferrer");
    }

    const print: PrintResult =
      config?.enabled && !thermalPrepared
        ? {
            ok: false,
            status: "permission_denied",
            message:
              "Koneksi printer dibatalkan. PDF tetap dibuka — atur printer di Settings → Printer.",
          }
        : await printThermalInvoice(transaction, receiptSettings);

    const parts: string[] = ["PDF opened in a new tab."];
    if (print.ok) {
      parts.push(print.message ?? "ESC/POS receipt sent to printer.");
    } else if (config?.enabled) {
      parts.push(print.message ?? "Thermal print failed.");
    }

    return {
      ok: true,
      pdfUrl: pdfResult.pdfUrl,
      storagePath: pdfResult.storagePath,
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

export async function shareInvoiceViaWhatsApp(params: {
  transaction: Transaction;
  receiptSettings: ReceiptSettings;
  phone?: string;
  customerName?: string;
}): Promise<{ ok: boolean; message: string }> {
  const phone = params.phone?.trim();
  if (!phone || !normalizeWhatsAppPhone(phone)) {
    return {
      ok: false,
      message: "Nomor WhatsApp pelanggan tidak valid.",
    };
  }

  const pdfResult = await ensureInvoicePdfUrl(params.transaction, params.receiptSettings, {
    customerName: params.customerName,
    signedUrlExpiresInSeconds: WHATSAPP_PDF_URL_EXPIRY_SECONDS,
  });

  if (!pdfResult.ok || !pdfResult.pdfUrl) {
    return {
      ok: false,
      message: pdfResult.message ?? "Gagal membuat invoice PDF.",
    };
  }

  const message = buildWhatsAppInvoiceMessage({
    transaction: params.transaction,
    receiptSettings: params.receiptSettings,
    customerName: params.customerName,
    pdfUrl: pdfResult.pdfUrl,
  });

  let url: string;
  try {
    url = buildWhatsAppUrl(phone, message);
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Nomor WhatsApp tidak valid.",
    };
  }

  if (!openWhatsAppInvoiceShare(url)) {
    return {
      ok: false,
      message: "Popup diblokir. Izinkan popup untuk membuka WhatsApp.",
    };
  }

  try {
    await fetch("/api/invoices/document-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: params.transaction.id,
        channel: "whatsapp",
        status: "opened",
        recipient: phone,
        customerId: params.transaction.customerId,
        metadata: {
          pdfUrl: pdfResult.pdfUrl,
          storagePath: pdfResult.storagePath,
        },
      }),
    });
  } catch {
    /* logging must not block share */
  }

  return {
    ok: true,
    message: "WhatsApp dibuka — kirim pesan ke pelanggan.",
  };
}

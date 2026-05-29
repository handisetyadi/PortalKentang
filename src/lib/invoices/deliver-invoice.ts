import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { formatReceiptHTML } from "@/lib/pos/receipt-html";
import { getPrintAdapter } from "@/lib/print/adapter";
import type { PrintResult } from "@/lib/print/adapter";

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
  const html = formatReceiptHTML(transaction, receiptSettings);
  return getPrintAdapter().printReceipt(html);
}

/** Generate PDF → save to Supabase → open in new tab → print thermal receipt. */
export async function printInvoiceWithPdf(
  transaction: Transaction,
  receiptSettings: ReceiptSettings,
  options?: { customerName?: string }
): Promise<PrintInvoiceResult> {
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

    const print = await printThermalInvoice(transaction, receiptSettings);

    const parts: string[] = ["PDF saved to Supabase and opened in a new tab."];
    if (print.ok) {
      parts.push(print.message ?? "Thermal print sent.");
    } else {
      parts.push(print.message ?? "Thermal print failed — check QZ Tray or browser print.");
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

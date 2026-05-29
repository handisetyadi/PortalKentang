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

export async function printThermalInvoice(
  transaction: Transaction,
  receiptSettings: ReceiptSettings
): Promise<PrintResult> {
  const html = formatReceiptHTML(transaction, receiptSettings);
  return getPrintAdapter().printReceipt(html);
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

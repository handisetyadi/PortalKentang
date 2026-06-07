import type { ReceiptSettings, Transaction } from "@/lib/data/types";
import { formatReceiptDateTime } from "@/lib/print/receipt-lines";
import { formatCurrency } from "@/lib/utils";

/** Signed PDF link validity when sharing via WhatsApp (7 days). */
export const WHATSAPP_PDF_URL_EXPIRY_SECONDS = 604800;

const MAX_ITEM_LINES = 8;

/** Normalize phone for wa.me (digits only, Indonesia 08xx → 62xx). */
export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0")) {
    const normalized = `62${digits.slice(1)}`;
    return normalized.length >= 10 && normalized.length <= 15 ? normalized : null;
  }

  if (digits.startsWith("62")) {
    return digits.length >= 10 && digits.length <= 15 ? digits : null;
  }

  if (digits.length >= 9 && digits.length <= 15) {
    return digits;
  }

  return null;
}

function formatItemLine(item: Transaction["items"][number]): string {
  const name = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
  return `• ${name} x${item.quantity} — ${formatCurrency(item.lineTotal)}`;
}

export function buildWhatsAppInvoiceMessage(params: {
  transaction: Transaction;
  receiptSettings: ReceiptSettings;
  customerName?: string;
  pdfUrl: string;
}): string {
  const { transaction, receiptSettings, customerName, pdfUrl } = params;
  const when = formatReceiptDateTime(transaction.completedAt ?? transaction.createdAt);
  const lines: string[] = [];

  if (customerName?.trim()) {
    lines.push(`Halo ${customerName.trim()},`, "");
  }

  lines.push(`Terima kasih telah berbelanja di ${receiptSettings.storeName}.`, "");
  lines.push(`Struk: ${transaction.receiptNumber}`);
  lines.push(`Tanggal: ${when}`);
  lines.push(`Total: ${formatCurrency(transaction.total)}`, "");

  const items = transaction.items;
  const shown = items.slice(0, MAX_ITEM_LINES);
  for (const item of shown) {
    lines.push(formatItemLine(item));
  }
  const remaining = items.length - shown.length;
  if (remaining > 0) {
    lines.push(`...dan ${remaining} item lainnya`);
  }
  if (items.length > 0) {
    lines.push("");
  }

  lines.push("Unduh invoice PDF:");
  lines.push(pdfUrl);

  if (receiptSettings.footerText?.trim()) {
    lines.push("", receiptSettings.footerText.trim());
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    throw new Error("Nomor WhatsApp tidak valid.");
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppInvoiceShare(url: string): boolean {
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened != null;
}

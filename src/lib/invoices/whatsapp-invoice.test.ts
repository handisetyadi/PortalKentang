import { describe, expect, it } from "vitest";
import {
  buildWhatsAppInvoiceMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
} from "./whatsapp-invoice";
import type { ReceiptSettings, Transaction } from "@/lib/data/types";

const receiptSettings: ReceiptSettings = {
  storeName: "Kentang Cafe",
  paperWidthMm: 80,
  footerText: "Terima kasih! Sampai jumpa lagi.",
  taxNumber: "",
  copyCount: 1,
  autoCut: true,
};

const transaction: Transaction = {
  id: "txn-1",
  outletId: "out-1",
  cashierId: "user-1",
  receiptNumber: "KTG-0001",
  status: "completed",
  items: [
    {
      id: "ti-1",
      productId: "p1",
      productName: "Latte",
      variantName: "Large",
      modifierIds: [],
      modifierNames: [],
      quantity: 2,
      unitPrice: 37000,
      discountAmount: 0,
      taxAmount: 8140,
      lineTotal: 74000,
      fifoCogs: 0,
    },
  ],
  payments: [{ id: "pay-1", method: "qris", amount: 74000 }],
  subtotal: 74000,
  discountTotal: 0,
  taxTotal: 8140,
  total: 74000,
  fifoCogsTotal: 0,
  syncStatus: "synced",
  createdAt: "2026-06-03T10:00:00.000Z",
  completedAt: "2026-06-03T10:00:00.000Z",
};

describe("normalizeWhatsAppPhone", () => {
  it("converts Indonesian 08xx to 62xx", () => {
    expect(normalizeWhatsAppPhone("+6289876543210")).toBe("6289876543210");
    expect(normalizeWhatsAppPhone("089876543210")).toBe("6289876543210");
  });

  it("returns null for empty or too short", () => {
    expect(normalizeWhatsAppPhone("")).toBeNull();
    expect(normalizeWhatsAppPhone("123")).toBeNull();
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds wa.me link with encoded text", () => {
    const url = buildWhatsAppUrl("+6281234567890", "Halo Budi");
    expect(url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
    expect(decodeURIComponent(url.split("text=")[1])).toBe("Halo Budi");
  });
});

describe("buildWhatsAppInvoiceMessage", () => {
  it("includes receipt summary and pdf link", () => {
    const message = buildWhatsAppInvoiceMessage({
      transaction,
      receiptSettings,
      customerName: "Siti",
      pdfUrl: "https://example.com/invoice.pdf",
    });
    expect(message).toContain("Halo Siti");
    expect(message).toContain("Struk: KTG-0001");
    expect(message).toContain("Latte (Large) x2");
    expect(message).toContain("https://example.com/invoice.pdf");
    expect(message).toContain("Terima kasih! Sampai jumpa lagi.");
  });
});

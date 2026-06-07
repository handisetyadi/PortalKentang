import type { ReceiptSettings } from "@/lib/data/types";

export type PrinterOutletSettings = {
  printerName?: string;
  escPosMode?: string;
  useQzTray?: boolean;
};

export type CompanySettingsRow = {
  receipt: unknown;
  printer: unknown;
  integrations: unknown;
};

const DEFAULT_RECEIPT = (storeName: string): ReceiptSettings => ({
  storeName,
  paperWidthMm: 80,
  footerText: "",
  taxNumber: "",
  copyCount: 1,
  autoCut: true,
});

export function parseReceiptSettings(
  row: CompanySettingsRow | null | undefined,
  companyName: string
): ReceiptSettings {
  if (!row?.receipt || typeof row.receipt !== "object") {
    return DEFAULT_RECEIPT(companyName);
  }
  const r = row.receipt as Record<string, unknown>;
  const paper = r.paperWidthMm === 58 ? 58 : 80;
  return {
    storeName: typeof r.storeName === "string" ? r.storeName : companyName,
    logoUrl: typeof r.logoUrl === "string" ? r.logoUrl : undefined,
    paperWidthMm: paper,
    footerText: typeof r.footerText === "string" ? r.footerText : "",
    taxNumber: typeof r.taxNumber === "string" ? r.taxNumber : "",
    copyCount: typeof r.copyCount === "number" ? r.copyCount : 1,
    autoCut: typeof r.autoCut === "boolean" ? r.autoCut : true,
  };
}

export function receiptToJson(receipt: ReceiptSettings): Record<string, unknown> {
  return {
    storeName: receipt.storeName,
    logoUrl: receipt.logoUrl ?? null,
    paperWidthMm: receipt.paperWidthMm,
    footerText: receipt.footerText,
    taxNumber: receipt.taxNumber,
    copyCount: receipt.copyCount,
    autoCut: receipt.autoCut,
  };
}

export function parsePrinterSettings(
  row: CompanySettingsRow | null | undefined
): Record<string, PrinterOutletSettings> {
  if (!row?.printer || typeof row.printer !== "object" || Array.isArray(row.printer)) {
    return {};
  }
  const out: Record<string, PrinterOutletSettings> = {};
  for (const [key, value] of Object.entries(row.printer as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const v = value as Record<string, unknown>;
    out[key] = {
      printerName: typeof v.printerName === "string" ? v.printerName : undefined,
      escPosMode: typeof v.escPosMode === "string" ? v.escPosMode : undefined,
      useQzTray: typeof v.useQzTray === "boolean" ? v.useQzTray : undefined,
    };
  }
  return out;
}

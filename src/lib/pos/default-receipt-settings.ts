import type { ReceiptSettings } from "@/lib/data/types";

export function defaultReceiptSettings(storeName = "Store"): ReceiptSettings {
  return {
    storeName,
    paperWidthMm: 80,
    footerText: "Thank you!",
    taxNumber: "",
    copyCount: 1,
    autoCut: true,
  };
}

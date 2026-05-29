import { isQzAvailable, printEscPosWithQz } from "@/lib/print/qz-client";
import { buildReceiptEscPos } from "../escpos/formatter";
import type { PrintPayload, PrinterConfig } from "../types";

export const qzBridgeAdapter = {
  async isAvailable(): Promise<boolean> {
    return isQzAvailable();
  },

  async printPayload(payload: PrintPayload, config: PrinterConfig): Promise<void> {
    const escPos = buildReceiptEscPos(payload, config);
    const result = await printEscPosWithQz(escPos, config.qzPrinterName ?? "");
    if (!result.ok) {
      throw new Error(result.message ?? "QZ Tray print failed");
    }
  },
};

import {
  nativeConnect,
  nativeDisconnect,
  nativeGetStatus,
  nativeListDevices,
  nativePrintEscPosBase64,
  nativeRequestBluetoothPermissions,
} from "../bridge/android-bridge";
import { escPosToBase64 } from "../escpos/encode";
import { buildReceiptEscPos } from "../escpos/formatter";
import type { PrintPayload, PrinterConfig, PrinterDevice } from "../types";

export const androidNativeAdapter = {
  async listDevices(): Promise<PrinterDevice[]> {
    await nativeRequestBluetoothPermissions();
    return nativeListDevices();
  },

  async connect(config: PrinterConfig): Promise<void> {
    await nativeRequestBluetoothPermissions();
    if (!config.macAddress) {
      throw new Error("MAC address belum dipilih.");
    }
    await nativeConnect(config.macAddress);
  },

  async disconnect(): Promise<void> {
    await nativeDisconnect();
  },

  async getNativeStatus(): Promise<string> {
    return nativeGetStatus();
  },

  async printEscPos(escPos: string): Promise<void> {
    await nativePrintEscPosBase64(escPosToBase64(escPos));
  },

  async printPayload(payload: PrintPayload, config: PrinterConfig): Promise<void> {
    const escPos = buildReceiptEscPos(payload, config);
    await this.printEscPos(escPos);
  },
};

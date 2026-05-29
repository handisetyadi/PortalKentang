import { ThermalPrinterError } from "../errors";
import type { PrinterDevice } from "../types";

/**
 * Optional Web Bluetooth BLE — NOT the primary path for SPP thermal printers.
 * Many Woya/Epson generics use Bluetooth Classic; use android-native-bluetooth instead.
 */
export const bleFallbackAdapter = {
  async listDevices(): Promise<PrinterDevice[]> {
    throw new ThermalPrinterError(
      "UNSUPPORTED",
      "Web Bluetooth BLE belum diimplementasikan. Gunakan Android native bridge untuk printer SPP."
    );
  },

  async print(): Promise<void> {
    throw new ThermalPrinterError(
      "UNSUPPORTED",
      "BLE print tidak tersedia untuk printer thermal generic SPP."
    );
  },
};

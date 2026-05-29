import {
  listGrantedSerialPorts,
  prepareWebSerialForPrint,
  printEscPosViaWebSerial,
  requestSerialPort,
} from "@/lib/print/web-serial-client";
import { buildReceiptEscPos } from "../escpos/formatter";
import type { PrintPayload, PrinterConfig, PrinterDevice } from "../types";

export const webSerialAdapter = {
  async listDevices(): Promise<PrinterDevice[]> {
    const ports = await listGrantedSerialPorts();
    return ports.map((p) => ({ name: p.label, address: p.label }));
  },

  async prepare(): Promise<boolean> {
    return prepareWebSerialForPrint();
  },

  async pairNew(): Promise<boolean> {
    const port = await requestSerialPort();
    return port !== null;
  },

  async printPayload(payload: PrintPayload, config: PrinterConfig): Promise<void> {
    const escPos = buildReceiptEscPos(payload, config);
    const result = await printEscPosViaWebSerial(escPos, {
      baudRate: config.serialBaudRate ?? 9600,
    });
    if (!result.ok) {
      throw new Error(result.message ?? "Web Serial print failed");
    }
  },
};

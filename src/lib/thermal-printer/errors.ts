export type ThermalPrinterErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "BLUETOOTH_OFF"
  | "PRINTER_NOT_SELECTED"
  | "NOT_CONNECTED"
  | "PRINTER_UNREACHABLE"
  | "WRITE_FAILED"
  | "PAIRING_REQUIRED"
  | "CANCELLED"
  | "UNKNOWN";

export class ThermalPrinterError extends Error {
  readonly code: ThermalPrinterErrorCode;

  constructor(code: ThermalPrinterErrorCode, message: string) {
    super(message);
    this.name = "ThermalPrinterError";
    this.code = code;
  }
}

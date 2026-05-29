/** Thermal printer configuration persisted on device. */
export type PrinterConnectionType =
  | "android-native-bluetooth"
  | "web-serial"
  | "print-bridge"
  | "web-bluetooth-ble";

export type PrinterConfig = {
  enabled: boolean;
  connectionType: PrinterConnectionType;
  printerName?: string;
  macAddress?: string;
  paperWidth: 58 | 80;
  charsPerLine: number;
  autoCut: boolean;
  openDrawer?: boolean;
  /** QZ Tray printer name when connectionType is print-bridge */
  qzPrinterName?: string;
  /** Web Serial baud rate */
  serialBaudRate?: number;
};

export type PrintLine = {
  label?: string;
  value?: string;
  text?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  width?: 1 | 2;
  height?: 1 | 2;
};

export type PrintPayload = {
  type: "receipt" | "kitchen" | "label" | "raw";
  title?: string;
  orderNumber?: string;
  lines?: PrintLine[];
  rawText?: string;
};

export type PrinterDevice = {
  name: string;
  address?: string;
};

export type PrinterStatus =
  | "idle"
  | "unsupported"
  | "permission-required"
  | "printer-not-selected"
  | "ready"
  | "connecting"
  | "error";

export interface ThermalPrinterService {
  getConfig(): Promise<PrinterConfig | null>;
  saveConfig(config: PrinterConfig): Promise<void>;
  listDevices(): Promise<PrinterDevice[]>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testPrint(): Promise<void>;
  print(payload: PrintPayload): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  /** Call at start of user click before long async work (permissions / pair). */
  prepareForPrint(): Promise<boolean>;
}

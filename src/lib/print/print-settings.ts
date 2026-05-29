export type PrintMethod = "qz" | "web_serial" | "browser";

export type StoredPrintSettings = {
  /** QZ Tray printer name (when printMethod is qz). */
  printerName: string;
  printMethod: PrintMethod;
  /** Serial baud rate for Web Serial (Bluetooth SPP / USB-COM). */
  serialBaudRate: number;
  /** @deprecated migrated to printMethod */
  useQzTray?: boolean;
};

const STORAGE_KEY = "pk_print_settings";

const DEFAULTS: StoredPrintSettings = {
  printerName: "",
  printMethod: "web_serial",
  serialBaudRate: 9600,
};

function migrateLegacy(parsed: Partial<StoredPrintSettings>): PrintMethod {
  if (parsed.printMethod) return parsed.printMethod;
  if (parsed.useQzTray === true) return "qz";
  if (parsed.useQzTray === false) return "browser";
  return DEFAULTS.printMethod;
}

export function getStoredPrintSettings(): StoredPrintSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StoredPrintSettings>;
    return {
      printerName: parsed.printerName ?? DEFAULTS.printerName,
      printMethod: migrateLegacy(parsed),
      serialBaudRate: parsed.serialBaudRate ?? DEFAULTS.serialBaudRate,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveStoredPrintSettings(settings: StoredPrintSettings): void {
  if (typeof window === "undefined") return;
  const { printerName, printMethod, serialBaudRate } = settings;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ printerName, printMethod, serialBaudRate })
  );
}

export const SERIAL_BAUD_RATES = [9600, 19200, 38400, 57600, 115200] as const;

import type { PrinterConfig, PrinterConnectionType } from "./types";
import { charsPerLineForPaper } from "./escpos/formatter";
import { recommendedConnectionType } from "./environment";

const STORAGE_KEY = "pk_thermal_printer_config";
const LEGACY_KEY = "pk_print_settings";

const DEFAULT_CONFIG: PrinterConfig = {
  enabled: false,
  connectionType: "android-native-bluetooth",
  paperWidth: 80,
  charsPerLine: 48,
  autoCut: true,
  openDrawer: false,
  serialBaudRate: 9600,
};

function migrateLegacyPrintSettings(): PrinterConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      printMethod?: string;
      printerName?: string;
      serialBaudRate?: number;
      useQzTray?: boolean;
    };
    let connectionType: PrinterConnectionType = recommendedConnectionType();
    if (parsed.printMethod === "qz" || parsed.useQzTray) connectionType = "print-bridge";
    else if (parsed.printMethod === "web_serial") connectionType = "web-serial";
    const paperWidth = 80 as const;
    return {
      enabled: true,
      connectionType,
      printerName: parsed.printerName,
      qzPrinterName: parsed.printerName,
      paperWidth,
      charsPerLine: charsPerLineForPaper(paperWidth),
      autoCut: true,
      openDrawer: false,
      serialBaudRate: parsed.serialBaudRate ?? 9600,
    };
  } catch {
    return null;
  }
}

export async function loadPrinterConfig(): Promise<PrinterConfig> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONFIG, connectionType: recommendedConnectionType() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrinterConfig>;
      const paperWidth = parsed.paperWidth === 58 ? 58 : 80;
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        paperWidth,
        charsPerLine: parsed.charsPerLine ?? charsPerLineForPaper(paperWidth),
        connectionType: parsed.connectionType ?? recommendedConnectionType(),
      };
    }
    const migrated = migrateLegacyPrintSettings();
    if (migrated) {
      await savePrinterConfig(migrated);
      return migrated;
    }
  } catch {
    /* use defaults */
  }
  return {
    ...DEFAULT_CONFIG,
    connectionType: recommendedConnectionType(),
    charsPerLine: charsPerLineForPaper(DEFAULT_CONFIG.paperWidth),
  };
}

export async function savePrinterConfig(config: PrinterConfig): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

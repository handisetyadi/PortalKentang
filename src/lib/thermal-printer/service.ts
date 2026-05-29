import { ThermalPrinterError } from "./errors";
import { androidNativeAdapter } from "./adapters/android-native";
import { webSerialAdapter } from "./adapters/web-serial";
import { qzBridgeAdapter } from "./adapters/qz-bridge";
import { bleFallbackAdapter } from "./adapters/ble-fallback";
import { isAndroidNativeBridgeAvailable } from "./bridge/android-bridge";
import { isAndroidWebView, isWebSerialEnvironment } from "./environment";
import { buildReceiptEscPos, buildTestPrintPayload, charsPerLineForPaper } from "./escpos/formatter";
import { loadPrinterConfig, savePrinterConfig } from "./storage";
import type {
  PrintPayload,
  PrinterConfig,
  PrinterDevice,
  PrinterStatus,
  ThermalPrinterService,
} from "./types";

let cachedConfig: PrinterConfig | null = null;

async function getConfigCached(): Promise<PrinterConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadPrinterConfig();
  }
  return cachedConfig;
}

function invalidateConfigCache(): void {
  cachedConfig = null;
}

export class PortalKentangThermalPrinterService implements ThermalPrinterService {
  async getConfig(): Promise<PrinterConfig | null> {
    return getConfigCached();
  }

  async saveConfig(config: PrinterConfig): Promise<void> {
    const paperWidth = config.paperWidth === 58 ? 58 : 80;
    const normalized: PrinterConfig = {
      ...config,
      paperWidth,
      charsPerLine: config.charsPerLine || charsPerLineForPaper(paperWidth),
    };
    await savePrinterConfig(normalized);
    cachedConfig = normalized;
  }

  async listDevices(): Promise<PrinterDevice[]> {
    const config = await getConfigCached();
    switch (config.connectionType) {
      case "android-native-bluetooth":
        if (!isAndroidNativeBridgeAvailable()) return [];
        return androidNativeAdapter.listDevices();
      case "web-serial":
        if (!isWebSerialEnvironment()) return [];
        return webSerialAdapter.listDevices();
      case "web-bluetooth-ble":
        return bleFallbackAdapter.listDevices();
      default:
        return [];
    }
  }

  async connect(): Promise<void> {
    const config = await getConfigCached();
    if (config.connectionType === "android-native-bluetooth") {
      await androidNativeAdapter.connect(config);
      return;
    }
    if (config.connectionType === "web-serial") {
      const ok = await webSerialAdapter.prepare();
      if (!ok) throw new ThermalPrinterError("CANCELLED", "Pairing printer dibatalkan.");
      return;
    }
  }

  async disconnect(): Promise<void> {
    const config = await getConfigCached();
    if (config.connectionType === "android-native-bluetooth") {
      await androidNativeAdapter.disconnect();
    }
  }

  async getStatus(): Promise<PrinterStatus> {
    const config = await getConfigCached();

    if (!config.enabled) return "idle";

    if (config.connectionType === "android-native-bluetooth") {
      if (!isAndroidWebView() && !isAndroidNativeBridgeAvailable()) {
        return "unsupported";
      }
      if (!isAndroidNativeBridgeAvailable()) {
        return "unsupported";
      }
      if (!config.macAddress) return "printer-not-selected";
      try {
        const native = await androidNativeAdapter.getNativeStatus();
        if (native === "ready" || native === "connected") return "ready";
        if (native === "permission-required") return "permission-required";
        if (native === "connecting") return "connecting";
        return "error";
      } catch {
        return "error";
      }
    }

    if (config.connectionType === "web-serial") {
      if (!isWebSerialEnvironment()) return "unsupported";
      const devices = await webSerialAdapter.listDevices();
      return devices.length > 0 ? "ready" : "printer-not-selected";
    }

    if (config.connectionType === "print-bridge") {
      const ok = await qzBridgeAdapter.isAvailable();
      return ok ? "ready" : "error";
    }

    if (config.connectionType === "web-bluetooth-ble") {
      return "unsupported";
    }

    return "idle";
  }

  async prepareForPrint(): Promise<boolean> {
    const config = await getConfigCached();
    if (!config.enabled) return true;

    if (config.connectionType === "android-native-bluetooth") {
      if (!isAndroidNativeBridgeAvailable()) return false;
      try {
        await androidNativeAdapter.connect(config);
        return true;
      } catch (e) {
        if (e instanceof ThermalPrinterError && e.code === "PERMISSION_DENIED") {
          throw e;
        }
        return false;
      }
    }

    if (config.connectionType === "web-serial") {
      return webSerialAdapter.prepare();
    }

    return true;
  }

  async testPrint(): Promise<void> {
    const config = await getConfigCached();
    if (!config.enabled) {
      throw new ThermalPrinterError("PRINTER_NOT_SELECTED", "Thermal printing belum diaktifkan.");
    }
    const payload = buildTestPrintPayload(
      "Kentang Cafe",
      config.charsPerLine || charsPerLineForPaper(config.paperWidth)
    );
    await this.print(payload);
  }

  async print(payload: PrintPayload): Promise<void> {
    const config = await getConfigCached();
    if (!config.enabled) {
      throw new ThermalPrinterError(
        "PRINTER_NOT_SELECTED",
        "Aktifkan thermal printing di Settings → Printer."
      );
    }

    const escPos = buildReceiptEscPos(payload, config);

    switch (config.connectionType) {
      case "android-native-bluetooth": {
        if (!isAndroidNativeBridgeAvailable()) {
          throw new ThermalPrinterError(
            "UNSUPPORTED",
            "Direct print membutuhkan app Android PortalKentang (WebView + native bridge)."
          );
        }
        await androidNativeAdapter.connect(config);
        await androidNativeAdapter.printEscPos(escPos);
        return;
      }
      case "web-serial": {
        if (!isWebSerialEnvironment()) {
          throw new ThermalPrinterError(
            "UNSUPPORTED",
            "Web Serial tidak didukung di browser ini."
          );
        }
        await webSerialAdapter.printPayload(payload, config);
        return;
      }
      case "print-bridge": {
        await qzBridgeAdapter.printPayload(payload, config);
        return;
      }
      case "web-bluetooth-ble": {
        await bleFallbackAdapter.print();
        return;
      }
      default:
        throw new ThermalPrinterError("UNSUPPORTED", "Connection type tidak dikenal.");
    }
  }
}

let singleton: PortalKentangThermalPrinterService | null = null;

export function getThermalPrinterService(): ThermalPrinterService {
  if (!singleton) {
    singleton = new PortalKentangThermalPrinterService();
  }
  return singleton;
}

export function resetThermalPrinterConfigCache(): void {
  invalidateConfigCache();
}

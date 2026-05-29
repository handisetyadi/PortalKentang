"use client";

import { ThermalPrinterError } from "../errors";
import { getAndroidPrinterBridge } from "../environment";
import type { PrinterDevice } from "../types";

type NativeResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
};

function parseNative<T>(json: string): NativeResult<T> {
  try {
    return JSON.parse(json) as NativeResult<T>;
  } catch {
    return { ok: false, error: json || "Invalid native response" };
  }
}

function mapNativeError(code?: string, message?: string): ThermalPrinterError {
  const msg = message ?? "Native printer error";
  switch (code) {
    case "PERMISSION_DENIED":
      return new ThermalPrinterError("PERMISSION_DENIED", msg);
    case "BLUETOOTH_OFF":
      return new ThermalPrinterError("BLUETOOTH_OFF", msg);
    case "NOT_CONNECTED":
      return new ThermalPrinterError("NOT_CONNECTED", msg);
    case "PRINTER_UNREACHABLE":
      return new ThermalPrinterError("PRINTER_UNREACHABLE", msg);
    case "WRITE_FAILED":
      return new ThermalPrinterError("WRITE_FAILED", msg);
    case "PAIRING_REQUIRED":
      return new ThermalPrinterError("PAIRING_REQUIRED", msg);
    case "UNSUPPORTED":
      return new ThermalPrinterError("UNSUPPORTED", msg);
    default:
      return new ThermalPrinterError("UNKNOWN", msg);
  }
}

export function isAndroidNativeBridgeAvailable(): boolean {
  return Boolean(getAndroidPrinterBridge());
}

export async function nativeRequestBluetoothPermissions(): Promise<void> {
  const bridge = getAndroidPrinterBridge();
  if (!bridge) {
    throw new ThermalPrinterError(
      "UNSUPPORTED",
      "Android native bridge tidak tersedia. Gunakan app Android WebView PortalKentang."
    );
  }
  const result = parseNative<unknown>(bridge.requestBluetoothPermissions());
  if (!result.ok) throw mapNativeError(result.code, result.error);
}

export async function nativeListDevices(): Promise<PrinterDevice[]> {
  const bridge = getAndroidPrinterBridge();
  if (!bridge) {
    throw new ThermalPrinterError("UNSUPPORTED", "Native bridge tidak tersedia.");
  }
  const result = parseNative<PrinterDevice[]>(bridge.listDevices());
  if (!result.ok) throw mapNativeError(result.code, result.error);
  return result.data ?? [];
}

export async function nativeConnect(macAddress: string): Promise<void> {
  const bridge = getAndroidPrinterBridge();
  if (!bridge) throw new ThermalPrinterError("UNSUPPORTED", "Native bridge tidak tersedia.");
  if (!macAddress) {
    throw new ThermalPrinterError("PRINTER_NOT_SELECTED", "MAC address printer belum dipilih.");
  }
  const result = parseNative<unknown>(bridge.connect(macAddress));
  if (!result.ok) throw mapNativeError(result.code, result.error);
}

export async function nativeDisconnect(): Promise<void> {
  const bridge = getAndroidPrinterBridge();
  if (!bridge) return;
  const result = parseNative<unknown>(bridge.disconnect());
  if (!result.ok) throw mapNativeError(result.code, result.error);
}

export async function nativePrintEscPosBase64(dataBase64: string): Promise<void> {
  const bridge = getAndroidPrinterBridge();
  if (!bridge) throw new ThermalPrinterError("UNSUPPORTED", "Native bridge tidak tersedia.");
  const result = parseNative<unknown>(bridge.printEscPosBase64(dataBase64));
  if (!result.ok) throw mapNativeError(result.code, result.error);
}

export async function nativeGetStatus(): Promise<string> {
  const bridge = getAndroidPrinterBridge();
  if (!bridge) return "unsupported";
  const result = parseNative<{ status: string }>(bridge.getStatus());
  if (!result.ok) throw mapNativeError(result.code, result.error);
  return result.data?.status ?? "idle";
}

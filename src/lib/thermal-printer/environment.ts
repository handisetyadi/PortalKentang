/**
 * Runtime environment detection.
 * Primary target: Android WebView with native PortalKentangPrinter bridge.
 */

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isAndroidWebView(): boolean {
  if (!isBrowser()) return false;
  return /Android/i.test(navigator.userAgent ?? "") && Boolean(getAndroidPrinterBridge());
}

export function getAndroidPrinterBridge(): PortalKentangPrinterNative | undefined {
  if (!isBrowser()) return undefined;
  return window.PortalKentangPrinter;
}

export function isWebSerialEnvironment(): boolean {
  return isBrowser() && "serial" in navigator;
}

export function recommendedConnectionType(): import("./types").PrinterConnectionType {
  if (isAndroidWebView()) return "android-native-bluetooth";
  if (isWebSerialEnvironment()) return "web-serial";
  return "android-native-bluetooth";
}

/** Injected by Android WebView — see android/ module. */
export interface PortalKentangPrinterNative {
  listDevices(): string;
  connect(macAddress: string): string;
  disconnect(): string;
  printEscPosBase64(dataBase64: string): string;
  getStatus(): string;
  requestBluetoothPermissions(): string;
}

declare global {
  interface Window {
    PortalKentangPrinter?: PortalKentangPrinterNative;
  }
}

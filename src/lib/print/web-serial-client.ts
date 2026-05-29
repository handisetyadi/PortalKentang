"use client";

import { escPosStringToBytes } from "./escpos-bytes";

let cachedPort: SerialPort | null = null;

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export function describeSerialPort(port: SerialPort): string {
  const info = port.getInfo();
  if (info.bluetoothServiceClassId !== undefined) {
    return `Bluetooth (service 0x${info.bluetoothServiceClassId.toString(16)})`;
  }
  if (info.usbVendorId !== undefined) {
    const pid = info.usbProductId !== undefined ? info.usbProductId.toString(16) : "?";
    return `USB ${info.usbVendorId.toString(16)}:${pid}`;
  }
  return "Serial port";
}

export async function listGrantedSerialPorts(): Promise<
  { port: SerialPort; label: string }[]
> {
  if (!isWebSerialSupported()) return [];
  const ports = await navigator.serial.getPorts();
  return ports.map((port) => ({ port, label: describeSerialPort(port) }));
}

/** User gesture required — opens browser picker (USB / Bluetooth serial). */
export async function requestSerialPort(): Promise<SerialPort | null> {
  if (!isWebSerialSupported()) return null;
  try {
    // No USB-only filters — Bluetooth SPP devices must appear in the list.
    const port = await navigator.serial.requestPort();
    cachedPort = port;
    return port;
  } catch (e) {
    if (e instanceof DOMException && (e.name === "NotFoundError" || e.name === "AbortError")) {
      return null;
    }
    if (e instanceof DOMException && e.name === "SecurityError") {
      throw new Error(
        "Izin printer harus diminta saat tombol diklik. Tutup dialog lain lalu coba lagi."
      );
    }
    throw e;
  }
}

/**
 * Call at the start of a click handler (before any long await) when using Web Serial.
 * Pairs the port while the user gesture is still active.
 */
export async function prepareWebSerialForPrint(): Promise<boolean> {
  if (!isWebSerialSupported()) return true;

  if (cachedPort) return true;

  const granted = await navigator.serial.getPorts();
  if (granted.length > 0) {
    cachedPort = granted[0];
    return true;
  }

  const port = await requestSerialPort();
  return port !== null;
}

export function setCachedSerialPort(port: SerialPort | null): void {
  cachedPort = port;
}

export async function resolveSerialPort(): Promise<SerialPort | null> {
  if (!isWebSerialSupported()) return null;

  if (cachedPort) return cachedPort;

  const granted = await navigator.serial.getPorts();
  if (granted.length > 0) {
    cachedPort = granted[0];
    return cachedPort;
  }

  return null;
}

export async function printEscPosViaWebSerial(
  escPosData: string,
  options: { baudRate: number }
): Promise<{ ok: boolean; message?: string; portLabel?: string }> {
  if (!isWebSerialSupported()) {
    return {
      ok: false,
      message:
        "Web Serial is not supported in this browser. Use Chrome or Edge (desktop or Android).",
    };
  }

  let port: SerialPort | null = null;
  try {
    port = await resolveSerialPort();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not access serial port";
    return { ok: false, message };
  }

  if (!port) {
    return {
      ok: false,
      message:
        "No printer paired. Open Settings → Printer and tap “Pair Bluetooth / serial printer”.",
    };
  }

  const portLabel = describeSerialPort(port);
  const bytes = escPosStringToBytes(escPosData);

  try {
    const needsOpen = !port.writable;
    if (needsOpen) {
      await port.open({ baudRate: options.baudRate });
    }

    const writer = port.writable?.getWriter();
    if (!writer) {
      return { ok: false, message: "Serial port is not writable.", portLabel };
    }

    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }

    if (needsOpen) {
      await port.close();
    }

    cachedPort = port;
    return { ok: true, message: `ESC/POS sent via Web Serial (${portLabel})`, portLabel };
  } catch (e) {
    cachedPort = null;
    const message = e instanceof Error ? e.message : "Web Serial print failed";
    if (message.includes("already open")) {
      try {
        await port.close();
      } catch {
        /* ignore */
      }
    }
    return {
      ok: false,
      message: `${message}. Try unplugging/re-pairing the printer.`,
      portLabel,
    };
  }
}

"use client";

type QzModule = typeof import("qz-tray");

let qzPromise: Promise<QzModule["default"] | null> | null = null;

export async function getQz(): Promise<QzModule["default"] | null> {
  if (typeof window === "undefined") return null;
  if (!qzPromise) {
    qzPromise = import("qz-tray")
      .then((mod) => mod.default)
      .catch(() => null);
  }
  return qzPromise;
}

export async function isQzAvailable(): Promise<boolean> {
  const qz = await getQz();
  if (!qz) return false;
  try {
    if (qz.websocket.isActive()) return true;
    await qz.websocket.connect({ retries: 1, delay: 0.5 });
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}

export async function listQzPrinters(): Promise<string[]> {
  const qz = await getQz();
  if (!qz) return [];
  const connected = await isQzAvailable();
  if (!connected) return [];
  try {
    return await qz.printers.find();
  } catch {
    return [];
  }
}

export async function printHtmlWithQz(
  html: string,
  printerName: string
): Promise<{ ok: boolean; message?: string }> {
  const qz = await getQz();
  if (!qz) {
    return { ok: false, message: "QZ Tray library failed to load" };
  }

  const connected = await isQzAvailable();
  if (!connected) {
    return {
      ok: false,
      message: "QZ Tray is not running. Start QZ Tray, then try again.",
    };
  }

  try {
    const printers = await qz.printers.find();
    const name =
      printerName && printers.includes(printerName)
        ? printerName
        : printers[0];

    if (!name) {
      return { ok: false, message: "No thermal printer found in QZ Tray" };
    }

    const config = qz.configs.create(name);
    const data = [
      {
        type: "pixel" as const,
        format: "html" as const,
        flavor: "plain" as const,
        data: html,
      },
    ];

    await qz.print(config, data);
    return { ok: true, message: `Sent to printer: ${name}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "QZ print failed";
    return { ok: false, message };
  }
}

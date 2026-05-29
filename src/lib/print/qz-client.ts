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
    await qz.websocket.connect({ retries: 2, delay: 0.5 });
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

export function resolveQzPrinterName(requested: string, printers: string[]): string | null {
  if (printers.length === 0) return null;
  const trimmed = requested.trim();
  if (!trimmed) return printers[0];
  if (printers.includes(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  const exactIgnoreCase = printers.find((p) => p.toLowerCase() === lower);
  if (exactIgnoreCase) return exactIgnoreCase;

  const partial = printers.find(
    (p) => p.toLowerCase().includes(lower) || lower.includes(p.toLowerCase())
  );
  return partial ?? printers[0];
}

/** Send raw ESC/POS bytes to the selected thermal printer via QZ Tray. */
export async function printEscPosWithQz(
  escPosData: string,
  printerName: string
): Promise<{ ok: boolean; message?: string; printer?: string }> {
  const qz = await getQz();
  if (!qz) {
    return { ok: false, message: "QZ Tray library failed to load" };
  }

  const connected = await isQzAvailable();
  if (!connected) {
    return {
      ok: false,
      message:
        "QZ Tray is not running. Install QZ Tray, start it, and allow this site in Site Manager.",
    };
  }

  try {
    const printers = await qz.printers.find();
    const name = resolveQzPrinterName(printerName, printers);

    if (!name) {
      return {
        ok: false,
        message:
          "No printer found. Connect your thermal printer (USB), install its driver, then refresh the list in Settings → Printer.",
      };
    }

    const config = qz.configs.create(name);
    await qz.print(config, [
      {
        type: "raw",
        format: "command",
        flavor: "plain",
        data: escPosData,
      },
    ]);

    return { ok: true, message: `Printed via ESC/POS on: ${name}`, printer: name };
  } catch (e) {
    const message = e instanceof Error ? e.message : "QZ print failed";
    return { ok: false, message };
  }
}

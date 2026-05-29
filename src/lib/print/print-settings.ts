export type StoredPrintSettings = {
  printerName: string;
  useQzTray: boolean;
};

const STORAGE_KEY = "pk_print_settings";

const DEFAULTS: StoredPrintSettings = {
  printerName: "",
  useQzTray: true,
};

export function getStoredPrintSettings(): StoredPrintSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StoredPrintSettings>;
    return {
      printerName: parsed.printerName ?? DEFAULTS.printerName,
      useQzTray: parsed.useQzTray ?? DEFAULTS.useQzTray,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveStoredPrintSettings(settings: StoredPrintSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

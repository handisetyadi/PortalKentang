"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPrintAdapter } from "@/lib/print/adapter";
import { listQzPrinters } from "@/lib/print/qz-client";
import {
  getStoredPrintSettings,
  saveStoredPrintSettings,
  SERIAL_BAUD_RATES,
  type PrintMethod,
  type StoredPrintSettings,
} from "@/lib/print/print-settings";
import {
  isWebSerialSupported,
  listGrantedSerialPorts,
  requestSerialPort,
  setCachedSerialPort,
} from "@/lib/print/web-serial-client";
import type { ReceiptSettings, Transaction } from "@/lib/data/types";

const SAMPLE_RECEIPT: { transaction: Transaction; settings: ReceiptSettings } = {
  settings: {
    storeName: "Kentang Cafe",
    paperWidthMm: 80,
    footerText: "Terima kasih!",
    taxNumber: "01.234.567.8-901.000",
    copyCount: 1,
    autoCut: true,
  },
  transaction: {
    id: "test",
    outletId: "test",
    cashierId: "test",
    receiptNumber: "TEST-0001",
    status: "completed",
    subtotal: 50000,
    discountTotal: 0,
    taxTotal: 5500,
    total: 55500,
    fifoCogsTotal: 0,
    syncStatus: "synced",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    items: [
      {
        id: "1",
        productId: "p1",
        productName: "Test Item",
        modifierIds: [],
        modifierNames: [],
        quantity: 1,
        unitPrice: 50000,
        discountAmount: 0,
        taxAmount: 5500,
        lineTotal: 55500,
        fifoCogs: 0,
      },
    ],
    payments: [{ id: "pay1", method: "cash", amount: 55500 }],
  },
};

const METHOD_LABELS: Record<PrintMethod, string> = {
  web_serial: "Web Serial (Bluetooth / USB — tanpa QZ)",
  qz: "QZ Tray",
  browser: "Browser print (dialog sistem)",
};

export function PrinterSettingsPanel() {
  const [settings, setSettings] = useState<StoredPrintSettings>(getStoredPrintSettings);
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [serialPorts, setSerialPorts] = useState<{ label: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const webSerialOk = isWebSerialSupported();

  const refreshQzPrinters = useCallback(async () => {
    const list = await listQzPrinters();
    setQzPrinters(list);
    if (list.length > 0 && !settings.printerName && settings.printMethod === "qz") {
      setSettings((s) => ({ ...s, printerName: list[0] }));
    }
  }, [settings.printerName, settings.printMethod]);

  const refreshSerialPorts = useCallback(async () => {
    const list = await listGrantedSerialPorts();
    setSerialPorts(list.map((p) => ({ label: p.label })));
  }, []);

  useEffect(() => {
    setSettings(getStoredPrintSettings());
    void refreshQzPrinters();
    void refreshSerialPorts();
  }, [refreshQzPrinters, refreshSerialPorts]);

  const persist = (next: StoredPrintSettings) => {
    setSettings(next);
    saveStoredPrintSettings(next);
  };

  const checkConnection = async () => {
    setBusy(true);
    try {
      const result = await getPrintAdapter().testPrinter();
      setStatus(result.message ?? result.status);
      await refreshQzPrinters();
      await refreshSerialPorts();
    } finally {
      setBusy(false);
    }
  };

  const pairSerialPrinter = async () => {
    if (!webSerialOk) {
      setStatus("Web Serial tidak didukung di browser ini. Gunakan Chrome atau Edge.");
      return;
    }
    setBusy(true);
    try {
      const port = await requestSerialPort();
      if (!port) {
        setStatus("Tidak ada perangkat dipilih.");
        return;
      }
      setCachedSerialPort(port);
      await refreshSerialPorts();
      setStatus("Printer dipasangkan. Jalankan Test print.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Gagal memasangkan printer.");
    } finally {
      setBusy(false);
    }
  };

  const testPrint = async () => {
    setBusy(true);
    saveStoredPrintSettings(settings);
    try {
      const result = await getPrintAdapter().printReceipt(
        SAMPLE_RECEIPT.transaction,
        SAMPLE_RECEIPT.settings
      );
      setStatus(result.message ?? (result.ok ? "Print sent" : "Print failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metode cetak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <fieldset className="space-y-2">
            {(Object.keys(METHOD_LABELS) as PrintMethod[]).map((method) => (
              <label
                key={method}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="print-method"
                  className="mt-1"
                  checked={settings.printMethod === method}
                  onChange={() => persist({ ...settings, printMethod: method })}
                />
                <span>
                  <span className="font-medium text-foreground">{METHOD_LABELS[method]}</span>
                  {method === "web_serial" && (
                    <span className="mt-0.5 block text-muted-foreground">
                      ESC/POS langsung ke printer Bluetooth (SPP) atau USB serial — tanpa QZ Tray.
                      Chrome / Edge desktop atau Android.
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={checkConnection}>
              Check connection
            </Button>
            <Button type="button" disabled={busy} onClick={testPrint}>
              Test print
            </Button>
          </div>

          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {settings.printMethod === "web_serial" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Web Serial (Bluetooth)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {!webSerialOk ? (
              <p className="text-destructive">
                Browser ini tidak mendukung Web Serial. Buka portal di Chrome atau Edge.
              </p>
            ) : (
              <>
                <p>
                  Pair printer Bluetooth thermal di OS terlebih dahulu (mode SPP / serial). Lalu
                  klik tombol di bawah dan pilih perangkat di dialog browser.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="baud-rate">Baud rate</Label>
                  <select
                    id="baud-rate"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={settings.serialBaudRate}
                    onChange={(e) =>
                      persist({ ...settings, serialBaudRate: Number(e.target.value) })
                    }
                  >
                    {SERIAL_BAUD_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs">Umum: 9600 untuk Bluetooth; 115200 untuk beberapa USB.</p>
                </div>
                {serialPorts.length > 0 && (
                  <p className="text-foreground">
                    Terhubung: {serialPorts.map((p) => p.label).join(", ")}
                  </p>
                )}
                <Button type="button" variant="outline" disabled={busy} onClick={pairSerialPrinter}>
                  Pair Bluetooth / serial printer
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {settings.printMethod === "qz" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QZ Tray</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Install{" "}
              <a
                href="https://qz.io/download/"
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                QZ Tray
              </a>{" "}
              dan izinkan situs ini di Site Manager.
            </p>
            <div className="space-y-2">
              <Label htmlFor="printer-name">Nama printer (QZ)</Label>
              {qzPrinters.length > 0 ? (
                <select
                  id="printer-name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={settings.printerName}
                  onChange={(e) => persist({ ...settings, printerName: e.target.value })}
                >
                  <option value="">Default (printer pertama)</option>
                  {qzPrinters.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="printer-name"
                  value={settings.printerName}
                  onChange={(e) => persist({ ...settings, printerName: e.target.value })}
                  placeholder="e.g. XP-80C"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {settings.printMethod === "browser" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Browser print</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Struk teks polos dibuka di dialog cetak sistem — pilih printer thermal secara manual.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

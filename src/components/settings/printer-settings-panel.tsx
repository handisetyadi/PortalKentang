"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { getPrintAdapter } from "@/lib/print/adapter";
import { listQzPrinters } from "@/lib/print/qz-client";
import {
  getStoredPrintSettings,
  saveStoredPrintSettings,
  type StoredPrintSettings,
} from "@/lib/print/print-settings";
import { formatReceiptHTML } from "@/lib/pos/receipt-html";
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

export function PrinterSettingsPanel() {
  const [settings, setSettings] = useState<StoredPrintSettings>(getStoredPrintSettings);
  const [printers, setPrinters] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshPrinters = useCallback(async () => {
    const list = await listQzPrinters();
    setPrinters(list);
    if (list.length > 0 && !settings.printerName) {
      setSettings((s) => ({ ...s, printerName: list[0] }));
    }
  }, [settings.printerName]);

  useEffect(() => {
    setSettings(getStoredPrintSettings());
    void refreshPrinters();
  }, [refreshPrinters]);

  const persist = (next: StoredPrintSettings) => {
    setSettings(next);
    saveStoredPrintSettings(next);
  };

  const checkQz = async () => {
    setBusy(true);
    try {
      const result = await getPrintAdapter().testPrinter();
      setStatus(result.message ?? result.status);
      await refreshPrinters();
    } finally {
      setBusy(false);
    }
  };

  const testPrint = async () => {
    setBusy(true);
    saveStoredPrintSettings(settings);
    try {
      const html = formatReceiptHTML(SAMPLE_RECEIPT.transaction, SAMPLE_RECEIPT.settings);
      const result = await getPrintAdapter().printReceipt(html);
      setStatus(result.message ?? (result.ok ? "Print sent" : "Print failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QZ Tray (thermal)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Install and run{" "}
            <a
              href="https://qz.io/download/"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              QZ Tray
            </a>{" "}
            for ESC/POS thermal printers (Epson, Xprinter, Panda, Star). Allow this site in QZ
            Tray → Site Manager.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-qz"
              checked={settings.useQzTray}
              onCheckedChange={(checked) =>
                persist({ ...settings, useQzTray: checked === true })
              }
            />
            <Label htmlFor="use-qz" className="font-normal text-foreground">
              Prefer QZ Tray when available
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="printer-name">Printer name (exact match in QZ)</Label>
            {printers.length > 0 ? (
              <select
                id="printer-name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.printerName}
                onChange={(e) => persist({ ...settings, printerName: e.target.value })}
              >
                <option value="">Default (first printer)</option>
                {printers.map((p) => (
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={checkQz}>
              Check QZ connection
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browser print</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If QZ Tray is off or unavailable, receipts print via a hidden frame (no popup). The
          system print dialog opens with the receipt content — choose your thermal printer there.
        </CardContent>
      </Card>
    </div>
  );
}

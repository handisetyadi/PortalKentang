"use client";

/**
 * Printer settings UI — all print operations go through ThermalPrinterService
 * (android-native-bluetooth primary, web-serial / QZ optional).
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getThermalPrinterService,
  resetThermalPrinterConfigCache,
} from "@/lib/thermal-printer/service";
import type { PrinterConfig, PrinterConnectionType, PrinterDevice, PrinterStatus } from "@/lib/thermal-printer/types";
import { isAndroidNativeBridgeAvailable } from "@/lib/thermal-printer/bridge/android-bridge";
import {
  isAndroidWebView,
  isWebSerialEnvironment,
  recommendedConnectionType,
} from "@/lib/thermal-printer/environment";
import { charsPerLineForPaper } from "@/lib/thermal-printer/escpos/formatter";
import { webSerialAdapter } from "@/lib/thermal-printer/adapters/web-serial";
import { SERIAL_BAUD_RATES } from "@/lib/print/print-settings";

const CONNECTION_OPTIONS: {
  value: PrinterConnectionType;
  label: string;
  hint: string;
}[] = [
  {
    value: "android-native-bluetooth",
    label: "Android Bluetooth (SPP) — recommended",
    hint: "Woya, Epson TM, Xprinter via Bluetooth Classic. Requires PortalKentang Android WebView.",
  },
  {
    value: "web-serial",
    label: "Web Serial (Chrome / Edge)",
    hint: "Fallback for USB-serial or limited BT on desktop. Not for most SPP-only printers.",
  },
  {
    value: "print-bridge",
    label: "QZ Tray (desktop bridge)",
    hint: "Legacy desktop POS with QZ Tray installed.",
  },
  {
    value: "web-bluetooth-ble",
    label: "Web Bluetooth BLE (experimental)",
    hint: "Not supported for typical thermal SPP printers.",
  },
];

const STATUS_MESSAGES: Record<PrinterStatus, string> = {
  idle: "Thermal printing disabled",
  unsupported: "Bluetooth / native bridge not available in this browser",
  "permission-required": "Bluetooth permission required — tap Connect",
  "printer-not-selected": "Select a paired printer",
  ready: "Connected / Ready",
  connecting: "Connecting…",
  error: "Failed to connect — check pairing and power",
};

export function ThermalPrinterSettingsPanel() {
  const [config, setConfig] = useState<PrinterConfig | null>(null);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [status, setStatus] = useState<PrinterStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const service = getThermalPrinterService();
  const nativeAvailable = isAndroidNativeBridgeAvailable();
  const webSerialOk = isWebSerialEnvironment();

  const refresh = useCallback(async () => {
    const cfg = await service.getConfig();
    setConfig(cfg);
    const st = await service.getStatus();
    setStatus(st);
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = async (next: PrinterConfig) => {
    await service.saveConfig(next);
    resetThermalPrinterConfigCache();
    setConfig(next);
  };

  const update = (patch: Partial<PrinterConfig>) => {
    if (!config) return;
    const paperWidth = patch.paperWidth ?? config.paperWidth;
    const next: PrinterConfig = {
      ...config,
      ...patch,
      paperWidth: paperWidth === 58 ? 58 : 80,
      charsPerLine: patch.charsPerLine ?? charsPerLineForPaper(paperWidth === 58 ? 58 : 80),
    };
    void persist(next);
  };

  const loadDevices = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const list = await service.listDevices();
      setDevices(list);
      setMessage(list.length ? `Found ${list.length} device(s).` : "No paired devices found.");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to list devices");
    } finally {
      setBusy(false);
    }
  };

  const pairWebSerial = async () => {
    setBusy(true);
    try {
      const ok = await webSerialAdapter.pairNew();
      setMessage(ok ? "Web Serial port paired." : "Pairing cancelled.");
      await loadDevices();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Pair failed");
    } finally {
      setBusy(false);
    }
  };

  const connectPrinter = async () => {
    setBusy(true);
    try {
      await service.connect();
      await refresh();
      setMessage("Printer connected.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Connect failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const saveAndTest = async () => {
    if (!config) return;
    setBusy(true);
    await service.saveConfig(config);
    try {
      await service.testPrint();
      setMessage("Test print sent successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Test print failed");
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  if (!config) {
    return <p className="text-sm text-muted-foreground">Loading printer settings…</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <Alert>
        <AlertDescription>
          {isAndroidWebView()
            ? "Android native bridge detected — direct ESC/POS to Bluetooth thermal (Woya, Epson, generic)."
            : "For Woya / Epson / generic SPP printers, use the PortalKentang Android app. Browser-only mode has limited Bluetooth support."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thermal printer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="thermal-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => update({ enabled: checked === true })}
            />
            <Label htmlFor="thermal-enabled">Enable thermal printing</Label>
          </div>

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium text-foreground">Status: </span>
            {STATUS_MESSAGES[status]}
            {nativeAvailable && config.connectionType === "android-native-bluetooth" && (
              <span className="block text-xs text-muted-foreground mt-1">Native bridge active</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Connection type</Label>
            <select
              className="select-field"
              value={config.connectionType}
              onChange={(e) =>
                update({
                  connectionType: e.target.value as PrinterConnectionType,
                })
              }
            >
              {CONNECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {CONNECTION_OPTIONS.find((o) => o.value === config.connectionType)?.hint}
            </p>
            {!nativeAvailable && config.connectionType === "android-native-bluetooth" && (
              <p className="text-xs text-amber-700">
                Native bridge not found. Build/install the Android WebView app (see cursor-docs/thermal-printer-android.md).
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Paper width</Label>
              <select
                className="select-field"
                value={config.paperWidth}
                onChange={(e) => {
                  const paperWidth = Number(e.target.value) === 58 ? 58 : 80;
                  update({
                    paperWidth,
                    charsPerLine: charsPerLineForPaper(paperWidth),
                  });
                }}
              >
                <option value={58}>58mm (32 chars)</option>
                <option value={80}>80mm (48 chars)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Characters per line</Label>
              <Input
                type="number"
                min={24}
                max={64}
                value={config.charsPerLine}
                onChange={(e) => update({ charsPerLine: Number(e.target.value) || 32 })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-cut"
                checked={config.autoCut}
                onCheckedChange={(checked) => update({ autoCut: checked === true })}
              />
              <Label htmlFor="auto-cut">Auto cut paper</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="open-drawer"
                checked={config.openDrawer ?? false}
                onCheckedChange={(checked) => update({ openDrawer: checked === true })}
              />
              <Label htmlFor="open-drawer">Open cash drawer (optional)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Printer device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printer-name">Printer name</Label>
            <Input
              id="printer-name"
              value={config.printerName ?? ""}
              onChange={(e) => update({ printerName: e.target.value })}
              placeholder="e.g. WOJA-58mm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mac-address">MAC address</Label>
            <Input
              id="mac-address"
              value={config.macAddress ?? ""}
              onChange={(e) => update({ macAddress: e.target.value.trim() })}
              placeholder="AA:BB:CC:DD:EE:FF"
              autoCapitalize="characters"
            />
          </div>

          {config.connectionType === "print-bridge" && (
            <div className="space-y-2">
              <Label>QZ printer name</Label>
              <Input
                value={config.qzPrinterName ?? ""}
                onChange={(e) => update({ qzPrinterName: e.target.value })}
                placeholder="XP-80C"
              />
            </div>
          )}

          {config.connectionType === "web-serial" && (
            <div className="space-y-2">
              <Label>Baud rate</Label>
              <select
                className="select-field"
                value={config.serialBaudRate ?? 9600}
                onChange={(e) => update({ serialBaudRate: Number(e.target.value) })}
              >
                {SERIAL_BAUD_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={loadDevices}>
              Load paired printers
            </Button>
            {config.connectionType === "android-native-bluetooth" && (
              <Button type="button" variant="outline" disabled={busy} onClick={connectPrinter}>
                Connect
              </Button>
            )}
            {config.connectionType === "web-serial" && webSerialOk && (
              <Button type="button" variant="outline" disabled={busy} onClick={pairWebSerial}>
                Pair Web Serial port
              </Button>
            )}
          </div>

          {devices.length > 0 && (
            <div className="space-y-2">
              <Label>Select printer</Label>
              <select
                className="select-field"
                value={config.macAddress ?? ""}
                onChange={(e) => {
                  const device = devices.find((d) => d.address === e.target.value);
                  update({
                    macAddress: e.target.value,
                    printerName: device?.name ?? config.printerName,
                  });
                }}
              >
                <option value="">— Select —</option>
                {devices.map((d) => (
                  <option key={d.address ?? d.name} value={d.address ?? ""}>
                    {d.name}
                    {d.address ? ` (${d.address})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              void persist({
                ...config,
                connectionType: recommendedConnectionType(),
              }).then(refresh);
            }}
          >
            Use recommended connection
          </Button>
          <Button type="button" disabled={busy || !config.enabled} onClick={saveAndTest}>
            Test print
          </Button>
        </CardContent>
      </Card>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

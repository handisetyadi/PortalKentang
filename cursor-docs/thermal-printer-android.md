# Thermal printer architecture (PortalKentang)

## Stack audit

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 App Router, React 19, TypeScript |
| UI | Settings → Printer (`/settings/printer`) |
| Print service | `src/lib/thermal-printer/` |
| Legacy adapters | QZ Tray, Web Serial (optional fallbacks) |
| Android | WebView scaffold in `/android` (not bundled in Next build) |

**Primary path:** `android-native-bluetooth` → `window.PortalKentangPrinter` → Bluetooth Classic SPP → raw ESC/POS.

**Not used for thermal:** `window.print()` (browser dialog).

## Print flow

1. User configures printer in **Settings → Printer** (saved to `localStorage` key `pk_thermal_printer_config`).
2. On **Print invoice / receipt**, `printInvoiceWithPdf()` calls `prepareForPrint()` **before** PDF fetch (user gesture).
3. `ThermalPrinterService.print()` builds ESC/POS via `buildReceiptEscPos()` and sends through the active adapter.
4. PDF opens in a separate tab for archive; thermal print is independent.

## Module map

```
src/lib/thermal-printer/
  types.ts              PrinterConfig, PrintPayload, interface
  service.ts            PortalKentangThermalPrinterService
  storage.ts            Persist + migrate legacy pk_print_settings
  transaction-payload.ts  Transaction → PrintPayload
  escpos/               Generic ESC/POS commands + formatter
  bridge/android-bridge.ts  JS ↔ native JSON
  adapters/             android-native, web-serial, qz, ble-stub
```

## Compatibility

- **Woya, Epson TM, Xprinter, Bixolon, etc.** — use standard ESC/POS (init, align, bold, cut).
- **Bluetooth Classic SPP** — requires Android native bridge; Web Bluetooth BLE is **not** suitable for most cheap thermal printers.
- **58mm / 80mm** — `charsPerLine` 32 / 48 default.

## Limitations

| Item | Note |
|------|------|
| iOS WebView | No SPP bridge in this repo; needs separate native module |
| Pure browser | Only Web Serial / QZ fallbacks; no silent SPP print |
| BLE thermal | Not implemented (`web-bluetooth-ble` stub) |
| USB OTG Android | TODO on native side |
| Network 9100 | TODO |

## Manual testing

1. Pair printer in Android Settings → Bluetooth.
2. Install WebView app with `ThermalPrinterBridge` (see `android/README.md`).
3. Open PortalKentang → Settings → Printer.
4. Enable thermal, connection **Android Bluetooth**, Load paired printers, select MAC, Connect.
5. **Test print** — verify store name, items, cut.
6. Complete a POS sale → **Print invoice & receipt** — PDF tab + physical receipt.

## Android bridge injection note

`@JavascriptInterface` name must be `PortalKentangPrinter` so JS sees `window.PortalKentangPrinter`.

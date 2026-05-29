# PortalKentang Android WebView + Thermal Printer Bridge

## Architecture

The Next.js web app runs inside a **WebView**. Native Kotlin exposes `window.PortalKentangPrinter` for:

- Listing **paired Bluetooth Classic (SPP)** devices
- Connecting via `BluetoothSocket` (UUID `00001101-0000-1000-8000-00805F9B34FB`)
- Writing **raw ESC/POS bytes** (generic Woya, Epson TM, Xprinter, etc.)

The frontend uses `getThermalPrinterService()` — never calls `window.print()` for thermal receipts.

## Setup

1. Create or open your Android Studio project.
2. Copy `ThermalPrinterBridge.kt` and integrate `MainActivity.kt` pattern.
3. Add permissions to `AndroidManifest.xml` (see below).
4. Load your deployed PortalKentang URL (or `http://10.0.2.2:3000` for emulator dev).

## AndroidManifest permissions

```xml
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.INTERNET" />
```

## JS API (injected)

| Method | Description |
|--------|-------------|
| `requestBluetoothPermissions()` | Runtime permissions (Android 12+) |
| `listDevices()` | Paired BT devices JSON |
| `connect(mac)` | Open SPP socket |
| `disconnect()` | Close socket |
| `printEscPosBase64(data)` | Send raw bytes |
| `getStatus()` | `ready` / `idle` / `error` / … |

## Pairing printers

Users must pair the thermal printer in **Android Settings → Bluetooth** first (SPP). Then use **Settings → Printer** in the app to select MAC address.

## TODO

- [ ] Wire `ThermalPrinterBridge` into your production Android wrapper project
- [ ] Add USB OTG adapter (future) using same `printEscPosBase64` entry point
- [ ] Network printer (TCP 9100) via native socket (future)

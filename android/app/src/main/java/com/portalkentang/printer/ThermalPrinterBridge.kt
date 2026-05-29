package com.portalkentang.printer

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import android.webkit.JavascriptInterface
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.UUID

/**
 * JavaScript bridge: window.PortalKentangPrinter
 * Sends generic ESC/POS bytes over Bluetooth Classic SPP.
 */
class ThermalPrinterBridge(private val context: Context) {

    private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var socket: BluetoothSocket? = null
    private var connectedMac: String? = null

    private fun ok(data: Any? = null): String {
        val json = JSONObject().put("ok", true)
        when (data) {
            null -> {}
            is JSONObject -> json.put("data", data)
            is JSONArray -> json.put("data", data)
            else -> json.put("data", data)
        }
        return json.toString()
    }

    private fun err(code: String, message: String): String {
        return JSONObject()
            .put("ok", false)
            .put("code", code)
            .put("error", message)
            .toString()
    }

    private fun adapter(): BluetoothAdapter? {
        val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        return manager?.adapter
    }

    private fun hasConnectPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.BLUETOOTH_CONNECT
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    @JavascriptInterface
    fun requestBluetoothPermissions(): String {
        // Permissions should be requested from Activity before calling bridge methods.
        // This method reports current state to JS.
        return if (hasConnectPermission()) ok() else err("PERMISSION_DENIED", "BLUETOOTH_CONNECT not granted")
    }

    @JavascriptInterface
    fun listDevices(): String {
        if (!hasConnectPermission()) {
            return err("PERMISSION_DENIED", "Bluetooth permission required")
        }
        val bt = adapter() ?: return err("BLUETOOTH_OFF", "Bluetooth not available")
        if (!bt.isEnabled) return err("BLUETOOTH_OFF", "Bluetooth is disabled")

        val arr = JSONArray()
        try {
            val paired: Set<BluetoothDevice> = bt.bondedDevices
            for (device in paired) {
                arr.put(
                    JSONObject()
                        .put("name", device.name ?: "Unknown")
                        .put("address", device.address)
                )
            }
        } catch (se: SecurityException) {
            return err("PERMISSION_DENIED", se.message ?: "Permission denied")
        }
        return ok(arr)
    }

    @JavascriptInterface
    fun connect(macAddress: String): String {
        if (!hasConnectPermission()) {
            return err("PERMISSION_DENIED", "Bluetooth permission required")
        }
        val bt = adapter() ?: return err("BLUETOOTH_OFF", "Bluetooth not available")
        if (!bt.isEnabled) return err("BLUETOOTH_OFF", "Bluetooth is disabled")
        if (macAddress.isBlank()) return err("PRINTER_NOT_SELECTED", "MAC address required")

        disconnectInternal()

        return try {
            val device: BluetoothDevice = bt.getRemoteDevice(macAddress)
            val sock = device.createRfcommSocketToServiceRecord(sppUuid)
            sock.connect()
            socket = sock
            connectedMac = macAddress
            ok(JSONObject().put("status", "connected").put("mac", macAddress))
        } catch (e: IOException) {
            err("PRINTER_UNREACHABLE", e.message ?: "Could not connect")
        } catch (e: SecurityException) {
            err("PERMISSION_DENIED", e.message ?: "Permission denied")
        }
    }

    @JavascriptInterface
    fun disconnect(): String {
        disconnectInternal()
        return ok()
    }

    private fun disconnectInternal() {
        try {
            socket?.close()
        } catch (_: IOException) {
        }
        socket = null
        connectedMac = null
    }

    @JavascriptInterface
    fun printEscPosBase64(dataBase64: String): String {
        val sock = socket
        if (sock == null || !sock.isConnected) {
            return err("NOT_CONNECTED", "Printer not connected. Call connect(mac) first.")
        }
        return try {
            val bytes = Base64.decode(dataBase64, Base64.DEFAULT)
            sock.outputStream.write(bytes)
            sock.outputStream.flush()
            ok()
        } catch (e: IOException) {
            err("WRITE_FAILED", e.message ?: "Write failed")
        }
    }

    @JavascriptInterface
    fun getStatus(): String {
        val status = when {
            !hasConnectPermission() -> "permission-required"
            socket?.isConnected == true -> "ready"
            connectedMac != null -> "error"
            else -> "idle"
        }
        return ok(JSONObject().put("status", status).put("mac", connectedMac ?: ""))
    }
}

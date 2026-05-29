/** Web Serial API (Chrome / Edge). https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API */

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: number;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface SerialOutputSignals {
  dataTerminalReady?: boolean;
  requestToSend?: boolean;
  break?: boolean;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  bufferSize?: number;
  flowControl?: "none" | "hardware";
  signal?: SerialOutputSignals;
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: number;
}

interface SerialPort {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}

interface Navigator {
  readonly serial: Serial;
}

declare module "qz-tray" {
  type QzPrintData = {
    type: "raw" | "pixel";
    format: "command" | "html" | "image";
    flavor: "plain" | "base64";
    data: string;
  };

  const qz: {
    websocket: {
      isActive(): boolean;
      connect(options?: { retries?: number; delay?: number }): Promise<void>;
    };
    printers: {
      find(): Promise<string[]>;
    };
    configs: {
      create(printer: string): unknown;
    };
    print(config: unknown, data: QzPrintData[] | string[]): Promise<void>;
  };
  export default qz;
}

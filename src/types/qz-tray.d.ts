declare module "qz-tray" {
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
    print(config: unknown, data: unknown[]): Promise<void>;
  };
  export default qz;
}

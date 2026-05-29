import { cmdCut, cmdOpenDrawer } from "./commands";

export function encodeEscPos(commands: string): Uint8Array {
  return new TextEncoder().encode(commands);
}

export function escPosToBase64(commands: string): string {
  const bytes = encodeEscPos(commands);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function appendCutCommand(buffer: string, autoCut: boolean): string {
  return autoCut ? buffer + cmdCut(false) : buffer;
}

export function appendDrawerCommand(buffer: string, openDrawer?: boolean): string {
  return openDrawer ? buffer + cmdOpenDrawer() : buffer;
}

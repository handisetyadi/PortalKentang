/** Encode ESC/POS string (mix of control bytes + UTF-8 text) for serial write. */
export function escPosStringToBytes(data: string): Uint8Array {
  return new TextEncoder().encode(data);
}

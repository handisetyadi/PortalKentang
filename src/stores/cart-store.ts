import { create } from "zustand";
import type { CartLine, PaymentLine } from "@/types/domain";
import { getCartTotals } from "@/lib/pos/pricing";
import { generateLocalId } from "@/lib/utils";

interface CartState {
  lines: CartLine[];
  customerId?: string;
  cartNote?: string;
  heldOrderId?: string;
  addLine: (line: Omit<CartLine, "id">) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  setCustomer: (customerId?: string) => void;
  setCartNote: (note: string) => void;
  clear: () => void;
  getSubtotal: () => number;
  getTaxTotal: () => number;
  getTotal: () => number;
  loadHeld: (lines: CartLine[], customerId?: string, note?: string) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  customerId: undefined,
  cartNote: undefined,
  heldOrderId: undefined,

  addLine: (line) =>
    set((s) => ({
      lines: [...s.lines, { ...line, id: generateLocalId("cart") }],
    })),

  updateQuantity: (lineId, quantity) =>
    set((s) => ({
      lines:
        quantity <= 0
          ? s.lines.filter((l) => l.id !== lineId)
          : s.lines.map((l) => (l.id === lineId ? { ...l, quantity } : l)),
    })),

  removeLine: (lineId) => set((s) => ({ lines: s.lines.filter((l) => l.id !== lineId) })),

  setCustomer: (customerId) => set({ customerId }),
  setCartNote: (cartNote) => set({ cartNote }),

  clear: () => set({ lines: [], customerId: undefined, cartNote: undefined, heldOrderId: undefined }),

  getSubtotal: () => getCartTotals(get().lines).subtotal,
  getTaxTotal: () => getCartTotals(get().lines).taxTotal,
  getTotal: () => getCartTotals(get().lines).total,

  loadHeld: (lines, customerId, note) =>
    set({ lines, customerId, cartNote: note, heldOrderId: undefined }),
}));

export function buildPaymentsFromCart(
  total: number,
  method: string,
  split?: PaymentLine[]
): PaymentLine[] {
  if (split?.length) return split;
  return [{ method, amount: total }];
}

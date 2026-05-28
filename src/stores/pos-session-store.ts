import { create } from "zustand";
import type { PosSession } from "@/lib/data/types";

interface PosSessionState {
  activeSession: PosSession | null;
  setActiveSession: (session: PosSession | null) => void;
}

export const usePosSessionStore = create<PosSessionState>((set) => ({
  activeSession: null,
  setActiveSession: (activeSession) => set({ activeSession }),
}));

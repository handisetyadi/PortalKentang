"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSyncListeners } from "@/lib/offline/sync-engine";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initSyncListeners(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

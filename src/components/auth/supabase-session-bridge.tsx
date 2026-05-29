"use client";

import { useEffect } from "react";
import { refreshSupabaseSessionAction } from "@/lib/offline/server-actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/** Keeps Supabase auth cookies in sync with the portal session after server login. */
export function SupabaseSessionBridge() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void refreshSupabaseSessionAction();
  }, []);

  return null;
}

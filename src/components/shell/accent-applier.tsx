"use client";

import { useEffect } from "react";
import { applyAccentColor } from "@/lib/theme/accent";
import type { AccentColor } from "@/types/domain";

export function AccentApplier({ color }: { color: AccentColor }) {
  useEffect(() => {
    applyAccentColor(color);
  }, [color]);
  return null;
}

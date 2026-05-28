export type AccentColor =
  | "teal"
  | "lime"
  | "electric-blue"
  | "bright-pink"
  | "bright-orange";

export const ACCENT_COLORS: Record<AccentColor, { hsl: string; label: string }> = {
  teal: { hsl: "173 58% 39%", label: "Teal" },
  lime: { hsl: "84 81% 44%", label: "Lime" },
  "electric-blue": { hsl: "217 91% 60%", label: "Electric Blue" },
  "bright-pink": { hsl: "330 81% 60%", label: "Bright Pink" },
  "bright-orange": { hsl: "25 95% 53%", label: "Bright Orange" },
};

export function applyAccentColor(color: AccentColor) {
  if (typeof document === "undefined") return;
  const accent = ACCENT_COLORS[color] ?? ACCENT_COLORS.teal;
  document.documentElement.style.setProperty("--primary", accent.hsl);
  document.documentElement.style.setProperty("--accent", accent.hsl);
  document.documentElement.style.setProperty("--ring", accent.hsl);
}

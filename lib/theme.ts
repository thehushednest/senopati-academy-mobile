/**
 * Design tokens Senopati Academy — sinkron dengan web app.
 * Pattern di-port dari globals.css :root variables.
 */

export const colors = {
  brand: "#18c29c",
  brandStrong: "#0e8b70",
  brandSoft: "#d1fae5",
  accent: "#f59e0b",
  ink: "#0b1220",
  inkSoft: "#1f2937",
  muted: "#64748b",
  mutedSoft: "#94a3b8",
  line: "#e5e7eb",
  panel: "#ffffff",
  bg: "#f4f5f7",
  bgAlt: "#eef0f3",
  danger: "#ef4444",
  success: "#22c55e",
  warning: "#eab308",
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
};

export const font = {
  display: 32,
  h1: 26,
  h2: 20,
  h3: 16,
  body: 15,
  small: 13,
  tiny: 11,
};

export const weight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

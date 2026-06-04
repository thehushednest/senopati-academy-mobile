/**
 * Design tokens Senopati Academy — sinkron dengan editorial overhaul web
 * (Jun 2026). Drop "AI generic" rainbow + heavy bold pattern → warm paper
 * neutrals + 1 brand accent + Playfair Display (loaded via expo-font).
 */

export const colors = {
  // Brand — 1 accent only (teal)
  brand: "#12a985",
  brandStrong: "#0e8b70",
  brandSoft: "rgba(18, 169, 133, 0.08)",

  // Ink hierarchy — near-black, never pure
  ink: "#0c0f14",
  inkSoft: "#1a1d24",
  body: "#4b5159",
  muted: "#6a6f78",
  mutedSoft: "#9aa0a8",

  // Surface — warm paper
  bg: "#fdfcf9",
  /** @deprecated use panelSoft */
  bgAlt: "#f6f4ef",
  panel: "#ffffff",
  panelSoft: "#f6f4ef",

  // Lines
  line: "rgba(12, 15, 20, 0.08)",
  lineStrong: "rgba(12, 15, 20, 0.16)",

  // Status (used sparingly)
  danger: "#dc2626",
  success: "#0f766e",
  warning: "#b45309",

  // Accent — secondary, used minimally
  accent: "#b45309",
  accentSoft: "rgba(180, 83, 9, 0.08)",
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const font = {
  // Display sizes for hero (Playfair via expo-font kalau load, fallback system serif)
  hero: 30,
  display: 24,
  h1: 22,
  h2: 18,
  h3: 15,
  body: 15,
  small: 13,
  tiny: 11,
  micro: 10,
};

export const weight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  /** @deprecated avoid — too heavy, looks "AI generic" */
  extrabold: "800" as const,
};

/**
 * Font families.
 * - heading: pakai Playfair Display (loaded via expo-font di _layout.tsx)
 *   fallback ke system serif kalau belum load.
 * - body: System (San Francisco / Roboto).
 * - mono: untuk angka/data.
 */
export const fontFamily = {
  heading: "PlayfairDisplay",
  body: undefined as string | undefined, // pakai system
  mono: undefined as string | undefined,
};

/** Kicker style — uppercase brand-tinted micro label. */
export const kickerStyle = {
  fontSize: font.tiny,
  fontWeight: weight.semibold,
  color: colors.brand,
  letterSpacing: 1.8,
  textTransform: "uppercase" as const,
};

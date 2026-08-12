// design-tokens.ts — Design token dictionary + TypeScript types

// ─── Color Palette ────────────────────────────────────────────────────────────

export const brand = {
  50: "oklch(0.97 0.02 250)",
  100: "oklch(0.93 0.04 250)",
  200: "oklch(0.86 0.08 250)",
  300: "oklch(0.78 0.12 250)",
  400: "oklch(0.69 0.16 250)",
  500: "oklch(0.6 0.2 250)",
  600: "oklch(0.51 0.18 250)",
  700: "oklch(0.42 0.15 250)",
  800: "oklch(0.33 0.12 250)",
  900: "oklch(0.24 0.09 250)",
  950: "oklch(0.15 0.06 250)",
} as const;

export const surface = {
  50: "oklch(0.99 0 0)",
  100: "oklch(0.97 0 0)",
  200: "oklch(0.93 0 0)",
  300: "oklch(0.87 0 0)",
  400: "oklch(0.8 0 0)",
  500: "oklch(0.72 0 0)",
  600: "oklch(0.63 0 0)",
  700: "oklch(0.53 0 0)",
  800: "oklch(0.42 0 0)",
  900: "oklch(0.3 0 0)",
  950: "oklch(0.18 0 0)",
} as const;

export const text = {
  primary: "oklch(0.15 0 0)",
  secondary: "oklch(0.4 0 0)",
  muted: "oklch(0.6 0 0)",
  inverse: "oklch(0.99 0 0)",
  disabled: "oklch(0.75 0 0)",
} as const;

export const semantic = {
  success: { bg: "oklch(0.95 0.08 150)", text: "oklch(0.3 0.12 150)", border: "oklch(0.6 0.2 150)" },
  warning: { bg: "oklch(0.97 0.08 85)", text: "oklch(0.35 0.1 85)", border: "oklch(0.7 0.2 85)" },
  error: { bg: "oklch(0.95 0.1 25)", text: "oklch(0.3 0.15 25)", border: "oklch(0.6 0.22 25)" },
  info: { bg: "oklch(0.95 0.05 220)", text: "oklch(0.3 0.08 220)", border: "oklch(0.6 0.15 220)" },
} as const;

// ─── Game-specific ────────────────────────────────────────────────────────────

export const game = {
  health: "oklch(0.55 0.22 30)",
  mana: "oklch(0.55 0.18 250)",
  exp: "oklch(0.6 0.2 150)",
  shield: "oklch(0.6 0.15 200)",
  damage: "oklch(0.65 0.25 25)",
  rarity: {
    common: "oklch(0.7 0 0)",
    uncommon: "oklch(0.6 0.15 150)",
    rare: "oklch(0.6 0.2 220)",
    epic: "oklch(0.55 0.2 290)",
    legendary: "oklch(0.65 0.2 50)",
    mythic: "oklch(0.6 0.2 0)",
  },
} as const;

// ─── Spacing & Radius ─────────────────────────────────────────────────────────

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "80px",
} as const;

export const radius = {
  none: "0",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "9999px",
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadow = {
  sm: "0 1px 2px oklch(0 0 0 / 0.05)",
  md: "0 4px 6px -1px oklch(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px oklch(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px oklch(0 0 0 / 0.1)",
  glow: "0 0 15px oklch(0.6 0.2 250 / 0.4)",
  "glow-lg": "0 0 30px oklch(0.6 0.2 250 / 0.5)",
  "glow-error": "0 0 15px oklch(0.6 0.22 25 / 0.4)",
} as const;

// ─── Font & Typography ────────────────────────────────────────────────────────

export const fontFamily = {
  sans: ["Inter", "system-ui", "sans-serif"],
  mono: ["JetBrains Mono", "monospace"],
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────

export const duration = {
  instant: "50ms",
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
  verySlow: "1000ms",
} as const;

export const easing = {
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const breakpoint = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrandScale = keyof typeof brand;
export type SurfaceScale = keyof typeof surface;
export type TextToken = keyof typeof text;
export type SemanticColor = keyof typeof semantic;
export type GameRarity = keyof typeof game.rarity;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadow;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type ZIndexToken = keyof typeof zIndex;
export type BreakpointToken = keyof typeof breakpoint;

export type DesignToken =
  | BrandScale
  | SurfaceScale
  | TextToken
  | SemanticColor
  | SpacingToken
  | RadiusToken
  | ShadowToken
  | FontSizeToken
  | FontWeightToken
  | DurationToken
  | EasingToken
  | ZIndexToken
  | BreakpointToken;

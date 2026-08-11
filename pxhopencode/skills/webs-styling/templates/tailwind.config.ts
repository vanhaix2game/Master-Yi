// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand — OKLCH scale
        brand: {
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
        },
        // Surface — light / dark via CSS variables
        surface: {
          50: "var(--surface-50, oklch(0.99 0 0))",
          100: "var(--surface-100, oklch(0.97 0 0))",
          200: "var(--surface-200, oklch(0.93 0 0))",
          300: "var(--surface-300, oklch(0.87 0 0))",
          400: "var(--surface-400, oklch(0.8 0 0))",
          500: "var(--surface-500, oklch(0.72 0 0))",
          600: "var(--surface-600, oklch(0.63 0 0))",
          700: "var(--surface-700, oklch(0.53 0 0))",
          800: "var(--surface-800, oklch(0.42 0 0))",
          900: "var(--surface-900, oklch(0.3 0 0))",
          950: "var(--surface-950, oklch(0.18 0 0))",
        },
        // Text
        text: {
          primary: "var(--text-primary, oklch(0.15 0 0))",
          secondary: "var(--text-secondary, oklch(0.4 0 0))",
          muted: "var(--text-muted, oklch(0.6 0 0))",
          inverse: "var(--text-inverse, oklch(0.99 0 0))",
          disabled: "var(--text-disabled, oklch(0.75 0 0))",
        },
        // Semantic
        success: { 500: "oklch(0.6 0.2 150)", 600: "oklch(0.5 0.18 150)" },
        warning: { 500: "oklch(0.7 0.2 85)", 600: "oklch(0.6 0.18 85)" },
        error: { 500: "oklch(0.6 0.22 25)", 600: "oklch(0.5 0.2 25)" },
        info: { 500: "oklch(0.6 0.15 220)", 600: "oklch(0.5 0.13 220)" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      container: {
        center: true,
        padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
        screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        glow: "0 0 15px oklch(0.6 0.2 250 / 0.4)",
        "glow-lg": "0 0 30px oklch(0.6 0.2 250 / 0.5)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-in-fast": "fadeIn 0.15s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px oklch(0.6 0.2 250 / 0.3)" },
          "50%": { boxShadow: "0 0 20px oklch(0.6 0.2 250 / 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

export const tokens = {
  color: {
    brand: { 50: 'oklch(0.95 0.02 256)', 100: 'oklch(0.9 0.05 256)', 200: 'oklch(0.8 0.1 256)', 300: 'oklch(0.7 0.15 256)', 400: 'oklch(0.6 0.2 256)', 500: 'oklch(0.55 0.22 256)', 600: 'oklch(0.45 0.2 256)', 700: 'oklch(0.35 0.17 256)', 800: 'oklch(0.25 0.12 256)', 900: 'oklch(0.15 0.06 256)' },
    surface: { 50: 'oklch(0.99 0 0)', 100: 'oklch(0.97 0 0)', 200: 'oklch(0.93 0 0)', 300: 'oklch(0.85 0 0)', 800: 'oklch(0.2 0 0)', 850: 'oklch(0.15 0 0)', 900: 'oklch(0.1 0 0)', 950: 'oklch(0.05 0 0)' },
    text: { primary: 'oklch(0.1 0 0)', secondary: 'oklch(0.4 0 0)', muted: 'oklch(0.6 0 0)', inverse: 'oklch(0.95 0 0)', disabled: 'oklch(0.75 0 0)' },
  },
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  shadow: { sm: '0 1px 2px rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.12)', xl: '0 20px 40px -4px rgb(0 0 0 / 0.15)' },
  font: { sans: "'Inter','Segoe UI',system-ui,sans-serif", mono: "'JetBrains Mono','Fira Code',Consolas,monospace", game: "'Courier New',monospace" },
  animation: { fast: 150, normal: 250, slow: 400 },
};

export const gameTokens = {
  color: { bg: 'oklch(0.05 0 0)', surface: 'oklch(0.12 0 0)', hp: 'oklch(0.65 0.25 30)', hpFill: 'oklch(0.6 0.25 140)', score: 'oklch(0.7 0.15 200)', combo: 'oklch(0.7 0.25 330)', text: 'oklch(0.9 0 0)', muted: 'oklch(0.5 0 0)', accent: 'oklch(0.7 0.25 200)', danger: 'oklch(0.65 0.25 30)', warning: 'oklch(0.7 0.2 85)', success: 'oklch(0.6 0.2 140)', shield: 'oklch(0.6 0.2 240)' },
  glow: { accent: '0 0 12px oklch(0.7 0.25 200 / 0.4)', danger: '0 0 12px oklch(0.65 0.25 30 / 0.4)' },
  font: "'Courier New',monospace",
};

export const darkTokens = {
  surface: { 50: 'oklch(0.15 0 0)', 100: 'oklch(0.18 0 0)', 200: 'oklch(0.22 0 0)', 300: 'oklch(0.28 0 0)', 800: 'oklch(0.85 0 0)', 900: 'oklch(0.93 0 0)', 950: 'oklch(0.97 0 0)' },
  text: { primary: 'oklch(0.95 0 0)', secondary: 'oklch(0.75 0 0)', muted: 'oklch(0.55 0 0)', inverse: 'oklch(0.1 0 0)', disabled: 'oklch(0.35 0 0)' },
};

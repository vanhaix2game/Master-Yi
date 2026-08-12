export interface Palette {
  primary: string; secondary: string; accent: string;
  bg: string; surface: string; text: string; muted: string;
  danger: string; success: string; glow: string;
}

export const VIBRANT: Palette = {
  primary: '#FF6B35', secondary: '#004E89', accent: '#FFC857',
  bg: '#1A1A2E', surface: '#16213E', text: '#FFFFFF', muted: '#8B8BA0',
  danger: '#FF4444', success: '#44CC88', glow: '0 0 12px rgba(255,107,53,0.4)',
};

export const PASTEL: Palette = {
  primary: '#B8E6C8', secondary: '#FFD6E0', accent: '#FFD93D',
  bg: '#F5F5F5', surface: '#FFFFFF', text: '#2D2D2D', muted: '#999999',
  danger: '#FF6B6B', success: '#6BCB77', glow: '0 0 12px rgba(184,230,200,0.3)',
};

export const DARK: Palette = {
  primary: '#FF6B6B', secondary: '#4A4A6A', accent: '#FFD93D',
  bg: '#0A0A0A', surface: '#1A1A1A', text: '#E0E0E0', muted: '#666666',
  danger: '#FF4444', success: '#44CC88', glow: '0 0 12px rgba(255,107,107,0.4)',
};

export const NEON: Palette = {
  primary: '#00FFFF', secondary: '#FF00FF', accent: '#FFFF00',
  bg: '#050510', surface: '#0A0A20', text: '#FFFFFF', muted: '#555577',
  danger: '#FF3366', success: '#33FF99', glow: '0 0 12px rgba(0,255,255,0.5)',
};

export const RETRO: Palette = {
  primary: '#E0F8D8', secondary: '#88C070', accent: '#F0C060',
  bg: '#2D422D', surface: '#3A553A', text: '#E0F8D8', muted: '#88A088',
  danger: '#F06060', success: '#60F060', glow: '0 0 8px rgba(224,248,216,0.3)',
};

export const palettes = { VIBRANT, PASTEL, DARK, NEON, RETRO };

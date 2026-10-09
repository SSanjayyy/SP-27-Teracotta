// SYNCD — Midnight + Electric Blue (same palette as the web prototype)
export const colors = {
  void: '#0a0e1a',
  surface: '#121729',
  surfaceRaised: '#1a2138',
  surfaceHover: '#202a47',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',

  electric: '#3e7bfa',
  electricBright: '#5b93ff',
  electricGlow: '#6fe3ff',
  electricDim: 'rgba(62, 123, 250, 0.16)',

  text: '#edf1ff',
  textMuted: '#8891b0',
  textFaint: '#545d7a',

  success: '#4fd18b',
  warn: '#ffb35c',
  danger: '#ff6b7a',
} as const;

export const radius = { sm: 6, md: 10, lg: 16 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

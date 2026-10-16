// SYNCD — Midnight + Electric Blue (same palette as the web prototype)
export const colors = {
  void: '#12202A',
  surface: '#254154',
  surfaceRaised: '#294654',
  surfaceHover: '#376371',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  electric: '#349CD2',
  electricBright: '#0284C7',
  electricGlow: '#67B5DD',
  electricDim: 'rgba(52, 156, 210, 0.16)',
  text: '#FFFFFF',
  textMuted: '#C2CFED',
  textFaint: '#8891B0',
  success: '#44B56E',
  warn: '#E09237',
  danger: '#E35151',
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

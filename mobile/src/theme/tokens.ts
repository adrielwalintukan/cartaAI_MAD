// Satu-satunya berkas yang boleh memuat nilai warna mentah (docs/03 §2).
const primitive = {
  ivory: { 50: '#FFFDF8', 100: '#FAF6EE', 200: '#F2ECE0', 300: '#E4DCCB' },
  sand: { 500: '#8A826F' },
  ink: { 900: '#1F2A24', 600: '#5B645D', 500: '#6B726C' },
  forest: { 700: '#2F4A3C' },
  terracotta: { 100: '#F6E3D9', 300: '#E9A585', 400: '#E08A66', 600: '#A8482A', 700: '#8F3B21' },
  night: { 950: '#101511', 900: '#141A16', 800: '#1C241F', 700: '#252F29', 600: '#34403A', 400: '#6B7870' },
  paper: { 100: '#F3EEE2', 400: '#A9B1A9', 500: '#8D968E' },
  clay: { 900: '#3A2A22' },
  green: { 600: '#3F6B4A', 300: '#7DB68A' },
  amber: { 700: '#8A5C0E', 300: '#D9A441' },
  red: { 600: '#B3382C', 300: '#E5877C' },
  blue: { 700: '#35607A', 300: '#7FB0CC' },
} as const;

export const light = {
  bg: primitive.ivory[100],
  surface: primitive.ivory[50],
  surfaceRaised: primitive.ivory[50],
  surfaceSunken: primitive.ivory[200],
  text: primitive.ink[900],
  textMuted: primitive.ink[600],
  textSubtle: primitive.ink[500],
  border: primitive.ivory[300],
  borderStrong: primitive.sand[500],
  accent: primitive.terracotta[600],
  accentHover: primitive.terracotta[700],
  onAccent: primitive.ivory[50],
  accentSoft: primitive.terracotta[100],
  onAccentSoft: primitive.terracotta[700],
  inverse: primitive.forest[700],
  onInverse: primitive.ivory[100],
  success: primitive.green[600],
  warning: primitive.amber[700],
  danger: primitive.red[600],
  info: primitive.blue[700],
  successSoft: '#E6F0E6',
  warningSoft: '#F7ECD3',
  dangerSoft: '#F8E1DD',
  infoSoft: '#DFEAF1',
  scrim: 'rgba(31,42,36,0.55)',
  focusRing: primitive.terracotta[600],
  shadow: 'rgba(31,42,36,1)',
} as const;

export type Colors = { [K in keyof typeof light]: string };

export const dark: Colors = {
  bg: primitive.night[900],
  surface: primitive.night[800],
  surfaceRaised: primitive.night[700],
  surfaceSunken: primitive.night[950],
  text: primitive.paper[100],
  textMuted: primitive.paper[400],
  textSubtle: primitive.paper[500],
  border: primitive.night[600],
  borderStrong: primitive.night[400],
  accent: primitive.terracotta[400],
  accentHover: primitive.terracotta[300],
  onAccent: '#1A0F0A',
  accentSoft: primitive.clay[900],
  onAccentSoft: primitive.terracotta[300],
  inverse: primitive.paper[100],
  onInverse: primitive.ink[900],
  success: primitive.green[300],
  warning: primitive.amber[300],
  danger: primitive.red[300],
  info: primitive.blue[300],
  successSoft: '#1F3326',
  warningSoft: '#3A2F14',
  dangerSoft: '#3D1F1B',
  infoSoft: '#1A2C38',
  scrim: 'rgba(0,0,0,0.65)',
  focusRing: primitive.terracotta[400],
  shadow: 'rgba(0,0,0,1)',
};

export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96 } as const;
export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 } as const;
export const border = { hairline: 1, strong: 1.5 } as const;
export const breakpoints = { tablet: 768, desktop: 1024, wide: 1440 } as const;
export const maxWidth = { prose: 680, form: 560, auth: 420, content: 1120, page: 1280 } as const;
export const motion = { fast: 120, base: 200, slow: 320 } as const;
export const gutter = { mobile: 16, tablet: 24, desktop: 32 } as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

// Elevasi: elev.0 tanpa bayangan; elev.1 dropdown/toast; elev.2 modal/sheet (docs/03 §2.7).
export const elevation = {
  0: { opacity: 0, offsetY: 0, blur: 0, android: 0 },
  1: { opacity: 0.1, offsetY: 4, blur: 16, android: 4 },
  2: { opacity: 0.16, offsetY: 12, blur: 32, android: 8 },
} as const;

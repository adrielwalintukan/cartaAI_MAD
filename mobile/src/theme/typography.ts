export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
} as const;

type Style = { family: string; size: [number, number]; line: [number, number]; upper?: boolean; tracking?: number };

// [mobile, desktop] (docs/03 §2.4). Tablet: nilai tengah hanya untuk display/h1.
export const type = {
  display: { family: fontFamily.display, size: [36, 60], line: [42, 66], tracking: -0.01 },
  h1: { family: fontFamily.display, size: [30, 44], line: [36, 50], tracking: -0.01 },
  h2: { family: fontFamily.display, size: [24, 32], line: [30, 40] },
  h3: { family: fontFamily.sansSemibold, size: [18, 20], line: [26, 28] },
  bodyLg: { family: fontFamily.sans, size: [17, 18], line: [26, 28] },
  body: { family: fontFamily.sans, size: [16, 16], line: [24, 24] },
  bodySm: { family: fontFamily.sans, size: [14, 14], line: [20, 20] },
  label: { family: fontFamily.sansMedium, size: [14, 14], line: [20, 20] },
  caption: { family: fontFamily.sansMedium, size: [12, 12], line: [16, 16] },
  overline: { family: fontFamily.sansSemibold, size: [12, 12], line: [16, 16], upper: true, tracking: 0.08 },
} as const satisfies Record<string, Style>;

export type TypeVariant = keyof typeof type;

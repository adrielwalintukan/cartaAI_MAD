import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme, type Colors, type TypeVariant } from '../../theme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: keyof Colors;
  /** Hanya untuk frasa aksen di judul serif (docs/03 §2.4). */
  italic?: boolean;
  /** Teks sebaris di dalam Text lain: hanya warna/italic, tanpa gaya varian dan tanpa peran heading ganda. */
  inline?: boolean;
};

const HEADING_LEVEL: Partial<Record<TypeVariant, number>> = { display: 1, h1: 1, h2: 2, h3: 3 };

/** Satu-satunya pintu untuk teks bergaya: font dan skala tidak pernah ditulis ulang. */
export function Text({ variant = 'body', color = 'text', italic, inline, style, ...rest }: TextProps) {
  const { t, colors } = useTheme();
  const level = HEADING_LEVEL[variant];
  const headingProps = level && !inline && !rest.role ? { role: 'heading' as const, 'aria-level': level } : null;
  return (
    <RNText
      {...headingProps}
      {...rest}
      style={[!inline && t(variant), { color: colors[color] }, italic && { fontFamily: 'Fraunces_400Regular_Italic' }, style]}
    />
  );
}

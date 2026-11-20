import { Feather } from '@expo/vector-icons';
import React from 'react';
import { useTheme, type Colors } from '../../theme';

export type IconName = keyof typeof Feather.glyphMap;

type Props = {
  name: IconName;
  size?: 16 | 20 | 24;
  color?: keyof Colors;
  /** Ikon tanpa label disembunyikan dari pembaca layar; beri label di pembungkusnya. */
};

/** Satu set ikon: Feather (docs/03 §4). Dekoratif secara default. */
export function Icon({ name, size = 20, color = 'text' }: Props) {
  const { colors } = useTheme();
  return (
    <Feather name={name} size={size} color={colors[color]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden />
  );
}

import React from 'react';
import { useTheme } from '../../theme';
import { Text } from '../ui';

/** Logotype sementara: teks "CartaAI" Fraunces 600 22px (docs/03 §11 TBD). */
export function Logotype({ compact }: { compact?: boolean }) {
  const { colors } = useTheme();
  return <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 22, lineHeight: 28, color: colors.text }}>{compact ? 'C' : 'CartaAI'}</Text>;
}

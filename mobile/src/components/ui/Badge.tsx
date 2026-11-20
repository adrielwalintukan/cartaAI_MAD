import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type Colors } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { useFocusRing } from './useFocusRing';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const TONE: Record<BadgeTone, { bg: keyof Colors; fg: keyof Colors }> = {
  neutral: { bg: 'surfaceSunken', fg: 'textMuted' },
  accent: { bg: 'accentSoft', fg: 'onAccentSoft' },
  success: { bg: 'successSoft', fg: 'success' },
  warning: { bg: 'warningSoft', fg: 'warning' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
  info: { bg: 'infoSoft', fg: 'info' },
};

/** Status, tidak interaktif. Teks selalu menyebut status, bukan hanya warna. */
export function Badge({ label, tone = 'neutral', style }: { label: string; tone?: BadgeTone; style?: StyleProp<ViewStyle> }) {
  const { colors, radius } = useTheme();
  const c = TONE[tone];
  return (
    <View style={[{ height: 24, paddingHorizontal: 8, borderRadius: radius.sm, backgroundColor: colors[c.bg], justifyContent: 'center', alignSelf: 'flex-start' }, style]}>
      <Text variant="caption" color={c.fg}>{label}</Text>
    </View>
  );
}

/** Pilihan/filter, interaktif. */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const { colors, radius, border } = useTheme();
  const ring = useFocusRing();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      {...ring.handlers}
      style={[{
        height: 36, paddingHorizontal: 14, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: selected ? border.strong : border.hairline,
        borderColor: selected ? colors.accent : colors.borderStrong,
        backgroundColor: selected ? colors.accentSoft : 'transparent',
      }, ring.style]}
    >
      {selected ? <Icon name="check" size={16} color="onAccentSoft" /> : null}
      <Text variant="label" color={selected ? 'onAccentSoft' : 'text'}>{label}</Text>
    </Pressable>
  );
}

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';
import { useFocusRing } from './useFocusRing';

export type TabOption<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: TabOption<T>[]; value: T; onChange: (v: T) => void; label: string };

function TabButton({ label, selected, onPress, role }: { label: string; selected: boolean; onPress: () => void; role: 'tab' | 'radio' }) {
  const { colors, radius, border } = useTheme();
  const ring = useFocusRing();
  const seg = role === 'radio';
  return (
    <Pressable
      role={role}
      accessibilityState={{ selected }}
      aria-selected={seg ? undefined : selected}
      aria-checked={seg ? selected : undefined}
      accessibilityLabel={label}
      hitSlop={seg ? { top: 2, bottom: 2 } : undefined}
      onPress={onPress}
      {...ring.handlers}
      style={[
        seg
          ? { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: selected ? colors.surface : 'transparent', borderWidth: border.hairline, borderColor: selected ? colors.border : 'transparent' }
          : { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: selected ? colors.accent : 'transparent' },
        ring.style,
      ]}
    >
      <Text variant="label" color={selected ? (seg ? 'text' : 'accent') : 'textMuted'}>{label}</Text>
    </Pressable>
  );
}

/** Navigasi bagian dalam satu halaman. */
export function Tabs<T extends string>({ options, value, onChange, label }: Props<T>) {
  const { space, colors } = useTheme();
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} role="tablist" aria-label={label} contentContainerStyle={{ gap: space[6] }}>
        {options.map((o) => <TabButton key={o.value} role="tab" label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />)}
      </ScrollView>
    </View>
  );
}

/** 2-4 opsi eksklusif (Bulanan/Tahunan, Terang/Gelap/Sistem). */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  const { colors, radius } = useTheme();
  return (
    <View role="radiogroup" aria-label={label} style={{ flexDirection: 'row', padding: 2, gap: 2, backgroundColor: colors.surfaceSunken, borderRadius: radius.md }}>
      {options.map((o) => <TabButton key={o.value} role="radio" label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />)}
    </View>
  );
}

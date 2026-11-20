import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon, Text } from '../ui';
import { NavLink } from './NavLink';
import { tabNav, type NavItem } from './nav';

/** Tab bar mobile (< 768): ikon 24 + label; aktif berwarna aksen, tanpa pil. */
export function TabBar({ active, items = tabNav }: { active: string | null; items?: NavItem[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      role="tablist"
      style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: insets.bottom }}
    >
      {items.map((it) => {
        const on = it.key === active;
        return (
          <NavLink
            key={it.key}
            href={it.href}
            active={on}
            role="tab"
            accessibilityLabel={it.label}
            style={({ focus }) => [{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2 }, focus]}
          >
            <Icon name={it.icon} size={24} color={on ? 'accent' : 'textMuted'} />
            <Text variant="caption" color={on ? 'accent' : 'textMuted'}>{it.label}</Text>
          </NavLink>
        );
      })}
    </View>
  );
}

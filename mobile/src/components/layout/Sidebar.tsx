import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon, Segmented, Text } from '../ui';
import { Logotype } from './Logotype';
import { NavLink } from './NavLink';
import { appNav, type NavItem } from './nav';

type Props = { pathname: string; active: string | null; items?: NavItem[]; userLabel?: string; compact?: boolean };

/** Sidebar dashboard: 248 (desktop) atau rel ikon 72 (tablet). */
export function Sidebar({ active, items = appNav, userLabel, compact }: Props) {
  const { colors, radius, space, scheme, setScheme } = useTheme();
  return (
    <View
      role="navigation"
      aria-label="Dashboard"
      style={{ width: compact ? 72 : 248, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border, paddingVertical: space[6], paddingHorizontal: compact ? space[3] : space[4], gap: space[6] }}
    >
      <View style={{ alignItems: compact ? 'center' : 'flex-start', paddingHorizontal: compact ? 0 : space[2] }}><Logotype compact={compact} /></View>
      <View style={{ gap: space[1], flex: 1 }}>
        {items.map((it) => {
          const on = it.key === active;
          return (
            <NavLink
              key={it.key}
              href={it.href}
              active={on}
              accessibilityLabel={it.label}
              style={({ hovered, focus }) => [
                { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[3], borderRadius: radius.md, justifyContent: compact ? 'center' : 'flex-start',
                  backgroundColor: on ? colors.accentSoft : hovered ? colors.surfaceSunken : 'transparent',
                  borderLeftWidth: 3, borderLeftColor: on ? colors.accent : 'transparent' },
                focus,
              ]}
            >
              <Icon name={it.icon} color={on ? 'onAccentSoft' : 'textMuted'} />
              {compact ? null : <Text variant="label" color={on ? 'onAccentSoft' : 'text'}>{it.label}</Text>}
            </NavLink>
          );
        })}
      </View>
      {compact ? null : (
        <View style={{ gap: space[3] }}>
          {userLabel ? <Text variant="bodySm" color="textMuted" numberOfLines={1}>{userLabel}</Text> : null}
          <Segmented
            label="Tema"
            value={scheme}
            onChange={setScheme}
            options={[{ value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }, { value: 'system', label: 'Sistem' }]}
          />
        </View>
      )}
    </View>
  );
}

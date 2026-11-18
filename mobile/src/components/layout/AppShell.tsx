import { usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { activeKey, appNav, tabNav } from './nav';

/** Satu definisi rute, dua pembungkus: sidebar (>= 768) dan tab bar (mobile). */
export function AppShell({ children, userLabel }: { children: React.ReactNode; userLabel?: string }) {
  const { colors, bp } = useTheme();
  const pathname = usePathname();
  const wide = bp !== 'mobile';
  const active = activeKey(wide ? appNav : tabNav, pathname);
  return (
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.bg }}>
      {wide ? <Sidebar pathname={pathname} active={active} userLabel={userLabel} compact={bp === 'tablet'} /> : null}
      <View nativeID="main" style={{ flex: 1 }}>{children}</View>
      {wide ? null : <TabBar active={active} />}
    </View>
  );
}

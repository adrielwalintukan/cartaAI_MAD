import { usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { maxWidth, useTheme } from '../../theme';
import { Button, Icon, Modal, Text } from '../ui';
import { Logotype } from './Logotype';
import { NavLink } from './NavLink';
import { activeKey, marketingNav, type NavItem } from './nav';

type Props = { items?: NavItem[]; signedIn?: boolean; scrolled?: boolean };

/** Navbar web untuk landing/halaman publik. Mobile: logotype + menu → sheet. */
export function Navbar({ items = marketingNav, signedIn, scrolled }: Props) {
  const { colors, gutter, bp, space } = useTheme();
  const pathname = usePathname();
  const active = activeKey(items, pathname);
  const [open, setOpen] = useState(false);
  const compact = bp === 'mobile';

  return (
    <View
      role="navigation"
      aria-label="Utama"
      style={{ backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: scrolled ? colors.border : 'transparent' }}
    >
      {Platform.OS === 'web' ? <SkipLink /> : null}
      <View style={{ height: 64, width: '100%', maxWidth: maxWidth.content, alignSelf: 'center', paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', gap: space[6] }}>
        <NavLink href="/" accessibilityLabel="CartaAI, ke beranda" style={() => ({ minHeight: 44, justifyContent: 'center' })}><Logotype /></NavLink>
        {compact ? <View style={{ flex: 1 }} /> : (
          <View style={{ flexDirection: 'row', gap: space[6], flex: 1, marginLeft: space[4] }}>
            {items.map((it) => (
              <NavLink key={it.key} href={it.href} active={it.key === active} style={() => ({ minHeight: 44, justifyContent: 'center' })}>
                {({ hovered }) => (
                  <Text variant="label" color={it.key === active ? 'accent' : 'text'} style={{ textDecorationLine: hovered || it.key === active ? 'underline' : 'none' }}>{it.label}</Text>
                )}
              </NavLink>
            ))}
          </View>
        )}
        {signedIn ? <Button label="Buka dasbor" size="sm" href="/app" /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
            <Button label="Masuk" variant="ghost" size="sm" href="/masuk" />
            {compact ? null : <Button label="Mulai gratis" size="sm" href="/daftar" />}
          </View>
        )}
        {compact ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Menu" aria-expanded={open} onPress={() => setOpen(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="menu" size={24} />
          </Pressable>
        ) : null}
      </View>
      <Modal visible={open} onClose={() => setOpen(false)} title="Menu">
        {[...items, { key: 'start', label: 'Mulai gratis', href: '/daftar', icon: 'arrow-right' as const }].map((it) => (
          <NavLink key={it.key} href={it.href} onPress={() => setOpen(false)} style={() => ({ minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border })}>
            <Text>{it.label}</Text>
          </NavLink>
        ))}
      </Modal>
    </View>
  );
}

function SkipLink() {
  const { colors, radius } = useTheme();
  const [shown, setShown] = useState(false);
  return (
    <Pressable
      accessibilityRole="link"
      onFocus={() => setShown(true)}
      onBlur={() => setShown(false)}
      {...({ href: '#main' } as object)}
      style={{ position: 'absolute', left: 8, top: shown ? 8 : -100, zIndex: 10, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.inverse }}
    >
      <Text variant="label" color="onInverse">Lewati ke konten</Text>
    </Pressable>
  );
}

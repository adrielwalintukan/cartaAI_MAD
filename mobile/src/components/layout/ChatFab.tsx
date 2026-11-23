import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, FadeOutDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatPanel, useChatSession } from '../../features/chat/ChatPanel';
import { useTheme } from '../../theme';
import { Icon } from '../ui';

/** Ruang bawah yang harus disisakan layar agar isi terakhir (mis. tombol Lanjut) tidak tertutup tombol bantuan. */
export const ChatFabInset = createContext(0);
export const useChatFabInset = () => useContext(ChatFabInset);
export const CHAT_FAB_CLEARANCE = 56 + 24 + 16; // tinggi tombol + jarak bawah + napas

const EASE = Easing.out(Easing.exp);

/** Tombol bantuan mengambang; membuka popup chat di tempat (percakapan tetap ada saat ditutup-buka). */
export function ChatFab({ aboveTabBar }: { aboveTabBar: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors, radius, elev, bp } = useTheme();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const session = useChatSession();
  const mobile = bp === 'mobile';
  const bottom = aboveTabBar ? 56 + insets.bottom + 16 : 24;

  // Web: Esc menutup popup.
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {open && mobile ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}>
          <Pressable accessibilityLabel="Tutup bantuan" style={{ flex: 1 }} onPress={() => setOpen(false)} />
        </Animated.View>
      ) : null}
      {open ? (
        <Animated.View
          entering={FadeInDown.duration(450).easing(EASE)}
          exiting={FadeOutDown.duration(180)}
          accessibilityViewIsModal={mobile}
          role="dialog"
          aria-label="Bantuan CartaAI"
          style={mobile
            ? { position: 'absolute', left: 8, right: 8, bottom: insets.bottom + 8, top: Math.max(insets.top + 24, height * 0.12) }
            : { position: 'absolute', right: 24, bottom: bottom + 56 + 16, width: 384, height: Math.min(600, height - bottom - 56 - 48) }}
        >
          <View style={{ flex: 1, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden', ...elev(2) }}>
            <ChatPanel session={session} onClose={() => setOpen(false)} />
          </View>
        </Animated.View>
      ) : null}
      {open && mobile ? null : (
        <Animated.View entering={ZoomIn.delay(400).duration(500).easing(EASE)} style={{ position: 'absolute', right: 20, bottom }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={open ? 'Tutup bantuan' : 'Buka bantuan'}
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen((v) => !v)}
            style={({ pressed }) => ({ width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }], ...elev(1) })}
          >
            <Icon name={open ? 'x' : 'message-circle'} size={24} color="onAccent" />
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

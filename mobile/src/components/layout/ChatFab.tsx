import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../ui';

/** Tombol bantuan mengambang di area login (seperti ChatbotFAB versi lama), membuka /app/bantuan. */
export function ChatFab({ aboveTabBar }: { aboveTabBar: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, elev } = useTheme();
  return (
    <Animated.View
      entering={ZoomIn.delay(400).duration(500).easing(Easing.out(Easing.exp))}
      style={{ position: 'absolute', right: 20, bottom: aboveTabBar ? 56 + insets.bottom + 16 : 24 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Buka bantuan"
        onPress={() => router.push('/app/bantuan')}
        style={({ pressed }) => ({ width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }], ...elev(1) })}
      >
        <Icon name="message-circle" size={24} color="onAccent" />
      </Pressable>
    </Animated.View>
  );
}

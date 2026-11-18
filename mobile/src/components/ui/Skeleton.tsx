import React, { useEffect, useRef } from 'react';
import { Animated, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme';

type Props = { width?: DimensionValue; height?: number; radius?: 'sm' | 'md' | 'lg' | 'full'; style?: StyleProp<ViewStyle> };

/** Blok pemuatan. Denyut opacity dimatikan oleh reduce-motion (warna statis). */
export function Skeleton({ width = '100%', height = 16, radius: r = 'sm', style }: Props) {
  const { colors, radius } = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return <Animated.View style={[{ width, height, borderRadius: radius[r], backgroundColor: colors.surfaceSunken, opacity: v }, style]} />;
}

/** Pembungkus: menandai area sebagai sibuk bagi pembaca layar. */
export function SkeletonGroup({ children, label = 'Memuat' }: { children: React.ReactNode; label?: string }) {
  return <View accessibilityState={{ busy: true }} aria-busy accessibilityLabel={label}>{children}</View>;
}

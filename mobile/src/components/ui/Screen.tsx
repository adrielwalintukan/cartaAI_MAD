import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { maxWidth, useTheme } from '../../theme';
import { useChatFabInset } from '../layout/ChatFab';

type Props = {
  children: React.ReactNode;
  width?: keyof typeof maxWidth;
  /** false: tanpa ScrollView (layar yang mengatur gulirnya sendiri). */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Masuk layar: naik pelan dan melambat (satu bahasa easing dengan situs web). Reanimated mematuhi reduce-motion sistem.
const ENTER = FadeInDown.duration(560).easing(Easing.out(Easing.exp));

/** Latar halaman + kontainer tengah dengan gutter dan lebar maksimal responsif. */
export function Screen({ children, width = 'content', scroll = true, style }: Props) {
  const { colors, gutter } = useTheme();
  const fab = useChatFabInset();
  const inner = (
    <Animated.View entering={ENTER} style={[{ width: '100%', maxWidth: maxWidth[width], alignSelf: 'center', paddingHorizontal: gutter, paddingBottom: fab }, style]}>{children}</Animated.View>
  );
  return scroll ? (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1 }}>{inner}</ScrollView>
  ) : (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>{inner}</View>
  );
}

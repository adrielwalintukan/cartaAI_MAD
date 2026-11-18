import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { maxWidth, useTheme } from '../../theme';

type Props = {
  children: React.ReactNode;
  width?: keyof typeof maxWidth;
  /** false: tanpa ScrollView (layar yang mengatur gulirnya sendiri). */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Latar halaman + kontainer tengah dengan gutter dan lebar maksimal responsif. */
export function Screen({ children, width = 'content', scroll = true, style }: Props) {
  const { colors, gutter } = useTheme();
  const inner = (
    <View style={[{ width: '100%', maxWidth: maxWidth[width], alignSelf: 'center', paddingHorizontal: gutter }, style]}>{children}</View>
  );
  return scroll ? (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1 }}>{inner}</ScrollView>
  ) : (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>{inner}</View>
  );
}

import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ImageSourcePropType, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type Colors } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useFocusRing } from './useFocusRing';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** Ikon berupa gambar berwarna (mis. logo Google); menggantikan iconLeft. */
  iconImage?: ImageSourcePropType;
  loading?: boolean;
  fullWidth?: boolean;
  /** Bila diisi, tombol menjadi tautan (<a href> di web). */
  href?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = { sm: 36, md: 44, lg: 52 } as const;
const PAD = { sm: 16, md: 20, lg: 24 } as const;

export function Button({
  label, variant = 'primary', size = 'md', iconLeft, iconRight, iconImage, loading, fullWidth, href, disabled, onPress, style, ...rest
}: ButtonProps) {
  const { colors, radius, border, t } = useTheme();
  const ring = useFocusRing();
  // State sendiri (bukan style/children berupa fungsi) agar tetap bekerja di dalam <Link asChild>.
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inactive = !!disabled || !!loading;

  const look = (pressed: boolean, hovered: boolean) => {
    const hot = pressed || hovered;
    let bg: keyof Colors | 'transparent' = 'transparent';
    let fg: keyof Colors = 'text';
    let borderColor: keyof Colors | 'transparent' = 'transparent';
    switch (variant) {
      case 'primary': bg = hot ? 'accentHover' : 'accent'; fg = 'onAccent'; break;
      case 'danger': bg = 'danger'; fg = 'onAccent'; break;
      case 'secondary': bg = hot ? 'surfaceSunken' : 'surface'; borderColor = 'borderStrong'; break;
      case 'ghost': bg = hot ? 'surfaceSunken' : 'transparent'; fg = 'accent'; break;
      case 'link': fg = hot ? 'accentHover' : 'accent'; break;
    }
    if (disabled) { bg = variant === 'link' || variant === 'ghost' ? 'transparent' : 'surfaceSunken'; fg = 'textSubtle'; borderColor = 'transparent'; }
    return { bg, fg, borderColor };
  };

  const labelStyle = size === 'lg' ? { ...t('body'), fontFamily: 'Inter_600SemiBold' } : undefined;

  const node = (
    <Pressable
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      aria-disabled={inactive}
      hitSlop={size === 'sm' ? 4 : 0}
      disabled={inactive}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      {...ring.handlers}
      {...rest}
      // flatten: <Link asChild> meneruskan style ke DOM web, array akan error.
      style={StyleSheet.flatten((() => {
        const { bg, borderColor } = look(pressed, hovered);
        return [
          {
            minHeight: HEIGHT[size],
            paddingHorizontal: variant === 'link' ? 0 : PAD[size],
            borderRadius: radius.md,
            borderWidth: border.hairline,
            backgroundColor: bg === 'transparent' ? undefined : colors[bg],
            borderColor: borderColor === 'transparent' ? 'transparent' : colors[borderColor],
            opacity: pressed && variant === 'primary' ? 0.92 : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: inactive ? 'default' : 'pointer',
          } as ViewStyle,
          ring.style,
          style,
        ];
      })())}
    >
      {(() => {
        const { fg } = look(pressed, hovered);
        return (
          <>
            {loading ? (
              <View style={{ width: 20, alignItems: 'center' }}><ActivityIndicator size="small" color={colors[fg]} /></View>
            ) : iconImage ? (
              <Image source={iconImage} style={{ width: 20, height: 20 }} contentFit="contain" accessibilityIgnoresInvertColors />
            ) : iconLeft ? <Icon name={iconLeft} color={fg} /> : null}
            <Text
              variant="label"
              color={fg}
              numberOfLines={1}
              style={[labelStyle, variant === 'link' && { textDecorationLine: 'underline' }]}
            >
              {label}
            </Text>
            {iconRight && !loading ? <Icon name={iconRight} color={fg} /> : null}
          </>
        );
      })()}
    </Pressable>
  );
  return href ? <Link href={href as Href} asChild>{node}</Link> : node;
}

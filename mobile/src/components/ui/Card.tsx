import React from 'react';
import { Pressable, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useFocusRing } from './useFocusRing';

type Variant = 'plain' | 'interactive' | 'sunken';
type Props = ViewProps & {
  variant?: Variant;
  /** Wajib untuk kartu interaktif: ringkasan isi untuk pembaca layar. */
  accessibilityLabel?: string;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ variant = 'plain', onPress, selected, style, children, accessibilityLabel, ...rest }: Props) {
  const { colors, radius, space, bp, border } = useTheme();
  const ring = useFocusRing();
  const base: ViewStyle = {
    backgroundColor: variant === 'sunken' ? colors.surfaceSunken : colors.surface,
    borderRadius: radius.lg,
    padding: bp === 'desktop' ? space[6] : space[4],
    borderWidth: variant === 'sunken' ? 0 : selected ? border.strong : border.hairline,
    borderColor: selected ? colors.accent : colors.border,
  };
  if (variant === 'interactive' && onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        {...ring.handlers}
        style={(s) => [base, (s.pressed || (s as { hovered?: boolean }).hovered) && !selected && { borderColor: colors.borderStrong }, ring.style, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View accessibilityLabel={accessibilityLabel} {...rest} style={[base, style]}>{children}</View>;
}

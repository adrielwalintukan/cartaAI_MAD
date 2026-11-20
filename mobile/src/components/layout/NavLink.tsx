import { Link, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusRing } from '../ui/useFocusRing';

type State = { hovered: boolean; focus: StyleProp<ViewStyle> };
type Props = Omit<PressableProps, 'style' | 'children'> & {
  href: string;
  active?: boolean;
  style?: (s: State) => StyleProp<ViewStyle>;
  children: React.ReactNode | ((s: { hovered: boolean }) => React.ReactNode);
};

/** Tautan sungguhan di web (<a href>, bisa dirayapi), Pressable di native. Style/children dihitung di sini (bukan fungsi ke Pressable) agar <Link asChild> tidak menjatuhkannya. */
export function NavLink({ href, active, style, children, ...rest }: Props) {
  const ring = useFocusRing();
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href as Href} asChild>
      <Pressable
        accessibilityRole="link"
        aria-current={active ? 'page' : undefined}
        accessibilityState={{ selected: !!active }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        {...ring.handlers}
        {...rest}
        style={StyleSheet.flatten(style?.({ hovered, focus: ring.style })) as ViewStyle}
      >
        {typeof children === 'function' ? children({ hovered }) : children}
      </Pressable>
    </Link>
  );
}

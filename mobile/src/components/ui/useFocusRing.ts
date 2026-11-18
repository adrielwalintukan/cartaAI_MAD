import { useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

/** Cincin fokus 2px + offset 2px, hanya untuk :focus-visible di web (docs/03 §5). */
export function useFocusRing() {
  const { colors } = useTheme();
  const [on, setOn] = useState(false);
  const handlers = {
    onFocus: (e: { target?: unknown }) => {
      const el = e?.target as { matches?: (s: string) => boolean } | undefined;
      setOn(Platform.OS === 'web' && !!el?.matches?.(':focus-visible'));
    },
    onBlur: () => setOn(false),
  };
  const style = (on
    ? { outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: colors.focusRing }
    : null) as ViewStyle | null;
  return { on, handlers, style };
}

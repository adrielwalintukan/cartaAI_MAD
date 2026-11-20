import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { useBreakpoint } from './useBreakpoint';
import { border, elevation, gutter, maxWidth, motion, radius, space } from './tokens';
import { type, type TypeVariant } from './typography';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  const bp = useBreakpoint();
  const desktop = bp === 'desktop' ? 1 : 0;

  /** Gaya teks siap pakai untuk satu varian tipografi. */
  const t = (variant: TypeVariant) => {
    const s = type[variant];
    const mid = bp === 'tablet' && (variant === 'display' || variant === 'h1');
    const i = desktop;
    const size = mid ? Math.round((s.size[0] + s.size[1]) / 2) : s.size[i];
    const line = mid ? Math.round((s.line[0] + s.line[1]) / 2) : s.line[i];
    const upper = 'upper' in s && s.upper;
    return {
      fontFamily: s.family,
      fontSize: size,
      lineHeight: line,
      ...('tracking' in s && s.tracking ? { letterSpacing: s.tracking * size } : null),
      ...(upper ? { textTransform: 'uppercase' as const } : null),
    };
  };

  /** Bayangan lintas platform (iOS shadow*, Android elevation, web boxShadow). */
  const elev = (level: 0 | 1 | 2) => {
    const e = elevation[level];
    if (level === 0) return {};
    return {
      shadowColor: ctx.colors.shadow,
      shadowOpacity: ctx.isDark ? Math.min(e.opacity * 4, 0.55) : e.opacity,
      shadowOffset: { width: 0, height: e.offsetY },
      shadowRadius: e.blur,
      elevation: e.android,
    };
  };

  return {
    ...ctx, bp, t, elev, space, radius, border, motion, maxWidth,
    gutter: gutter[bp],
  };
}

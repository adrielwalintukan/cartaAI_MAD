import { useWindowDimensions } from 'react-native';
import { breakpoints, type Breakpoint } from './tokens';

export function breakpointFor(width: number): Breakpoint {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function useBreakpoint(): Breakpoint {
  return breakpointFor(useWindowDimensions().width);
}

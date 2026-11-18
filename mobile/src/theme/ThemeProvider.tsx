import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type Colors } from './tokens';

export type Scheme = 'light' | 'dark' | 'system';
const KEY = 'carta.theme.scheme';

export type ThemeContextValue = {
  scheme: Scheme;
  setScheme: (s: Scheme) => void;
  isDark: boolean;
  colors: Colors;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [scheme, setSchemeState] = useState<Scheme>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v === 'light' || v === 'dark' || v === 'system' ? setSchemeState(v) : undefined)
      .catch(() => undefined);
  }, []);

  const setScheme = useCallback((s: Scheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(KEY, s).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = (scheme === 'system' ? system : scheme) === 'dark';
    return { scheme, setScheme, isDark, colors: isDark ? dark : light };
  }, [scheme, system, setScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

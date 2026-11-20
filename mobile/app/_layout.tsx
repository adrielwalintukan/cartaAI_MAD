import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/components/ui';
import { AuthProvider } from '../src/features/auth';
import { queryClient } from '../src/lib/queryClient';
import { ThemeProvider, useAppFonts, useTheme } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function ThemedStack() {
  const { isDark, colors } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

export default function RootLayout() {
  const fontsReady = useAppFonts();
  useEffect(() => { if (fontsReady) SplashScreen.hideAsync().catch(() => undefined); }, [fontsReady]);
  if (!fontsReady) return null;

  // Urutan: Theme → QueryClient → Auth (docs/08 F2-4).
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <ThemedStack />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

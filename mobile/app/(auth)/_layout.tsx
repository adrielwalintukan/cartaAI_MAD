import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '../../src/features/auth';
import { Splash } from '../../src/components/layout/Splash';

/** Halaman tamu: bila sudah login → /app. */
export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (session) return <Redirect href="/app" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

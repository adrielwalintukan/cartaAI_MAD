import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { AppShell } from '../../src/components/layout';
import { Splash } from '../../src/components/layout/Splash';
import { useAuth } from '../../src/features/auth';

/** Guard area login: tanpa sesi → /masuk. */
export default function AppAreaLayout() {
  const { session, user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Redirect href="/masuk" />;
  return <AppShell userLabel={user?.email}><Slot /></AppShell>;
}

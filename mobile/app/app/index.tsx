import React from 'react';
import { Button, Screen, Text } from '../../src/components/ui';
import { useAuth } from '../../src/features/auth';
import { useTheme } from '../../src/theme';

// Kerangka F2-4: bukti guard berjalan. Dasbor sebenarnya di F3-3.
export default function AppHome() {
  const { user, signOut } = useAuth();
  const { space } = useTheme();
  return (
    <Screen style={{ paddingVertical: space[8], gap: space[4] }}>
      <Text variant="h1">Beranda</Text>
      <Text color="textMuted">Masuk sebagai {user?.email}</Text>
      <Button label="Keluar" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

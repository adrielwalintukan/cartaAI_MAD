import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Screen, Text, TextField } from '../../src/components/ui';
import { useAuth } from '../../src/features/auth';
import { useTheme } from '../../src/theme';

// Kerangka F2-4 agar login dapat diuji; layar penuh (dua panel, lupa password, dll.) dikerjakan di F3-2.
export default function Masuk() {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const { space } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true); setError(null);
    setError(await fn());
    setBusy(false);
  };

  return (
    <Screen width="auth" style={{ paddingVertical: space[12] }}>
      <Text variant="h1" style={{ marginBottom: space[2] }}>Masuk</Text>
      <Text color="textMuted" style={{ marginBottom: space[6] }}>Lanjutkan menyiapkan undanganmu.</Text>
      <Card style={{ gap: space[4] }}>
        <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" inputMode="email" />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={() => run(() => signInWithPassword(email, password))} error={error ?? undefined} />
        <Button label="Masuk" size="lg" fullWidth loading={busy} disabled={!email || !password} onPress={() => run(() => signInWithPassword(email, password))} />
        <Button label="Lanjut dengan Google" variant="secondary" size="lg" fullWidth disabled={busy} onPress={() => run(signInWithGoogle)} />
      </Card>
      <View style={{ marginTop: space[4], flexDirection: 'row', gap: space[1] }}>
        <Text variant="bodySm" color="textMuted">Belum punya akun?</Text>
        <Link href="/register"><Text variant="bodySm" color="accent">Daftar</Text></Link>
      </View>
    </Screen>
  );
}

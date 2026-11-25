import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Screen, Text, TextField } from '../../../components/ui';
import { Logotype } from '../../../components/layout';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../theme';
import { useAuth } from '../useAuth';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GOOGLE_G = require('../../../../assets/google-g.png');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <Screen width="auth" style={{ paddingVertical: space[12], gap: space[6] }}>
      <Logotype />
      <View style={{ gap: space[2] }}>
        <Text variant="h1">{title}</Text>
        <Text color="textMuted">{subtitle}</Text>
      </View>
      <Card style={{ gap: space[4] }}>{children}</Card>
      {footer}
    </Screen>
  );
}

const Alt = ({ q, label, href }: { q: string; label: string; href: string }) => (
  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
    <Text variant="bodySm" color="textMuted">{q}</Text>
    <Link href={href as never}><Text variant="bodySm" color="accent">{label}</Text></Link>
  </View>
);

/** Satu fungsi untuk semua aksi submit: tampilkan galat dari server apa adanya (sudah berbahasa pengguna). */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true); setError(null);
    try { setError(await fn()); } finally { setBusy(false); }
  };
  return { busy, error, setError, run };
}

export function LoginScreen() {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();
  const submit = () => run(() => signInWithPassword(email, password));
  return (
    <AuthFrame title="Masuk" subtitle="Lanjutkan menyiapkan undanganmu." footer={<Alt q="Belum punya akun?" label="Daftar" href="/daftar" />}>
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" inputMode="email" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={submit} error={error ?? undefined} />
      <Link href="/lupa-password"><Text variant="bodySm" color="accent">Lupa password?</Text></Link>
      <Button label="Masuk" size="lg" fullWidth loading={busy} disabled={!email || !password} onPress={submit} />
      <Button label="Lanjut dengan Google" iconImage={GOOGLE_G} variant="secondary" size="lg" fullWidth disabled={busy} onPress={() => run(signInWithGoogle)} />
    </AuthFrame>
  );
}

export function RegisterScreen() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, setError, run } = useAction();

  const submit = () => run(async () => {
    if (!EMAIL_RE.test(email.trim())) return 'Format email belum benar.';
    if (password.length < 8) return 'Password minimal 8 karakter.';
    if (password !== confirm) return 'Konfirmasi password tidak sama.';
    const { data, error: e } = await supabase.auth.signUp({ email: email.trim(), password });
    if (e) return e.message.toLowerCase().includes('registered') ? 'Email ini sudah terdaftar. Coba masuk.' : 'Pendaftaran gagal. Coba lagi sebentar lagi.';
    // Konfirmasi email nonaktif → sesi langsung ada dan guard mengalihkan ke /app.
    if (!data.session) setSent(true);
    return null;
  });

  if (sent) {
    return (
      <AuthFrame title="Cek emailmu" subtitle={`Kami mengirim tautan konfirmasi ke ${email.trim()}. Buka tautan itu, lalu masuk.`} footer={<Alt q="Sudah konfirmasi?" label="Masuk" href="/masuk" />}>
        <Button label="Ke halaman masuk" variant="secondary" fullWidth href="/masuk" />
      </AuthFrame>
    );
  }
  return (
    <AuthFrame title="Buat akun" subtitle="Gratis. Tidak perlu kartu kredit." footer={<Alt q="Sudah punya akun?" label="Masuk" href="/masuk" />}>
      <TextField label="Email" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" inputMode="email" />
      <TextField label="Password" hint="Minimal 8 karakter." value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <TextField label="Ulangi password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" onSubmitEditing={submit} error={error ?? undefined} />
      <Button label="Daftar" size="lg" fullWidth loading={busy} disabled={!email || !password || !confirm} onPress={submit} />
      <Button label="Daftar dengan Google" iconImage={GOOGLE_G} variant="secondary" size="lg" fullWidth disabled={busy} onPress={() => run(signInWithGoogle)} />
    </AuthFrame>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction();
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : 'cartaai://reset-password';
  const submit = () => run(async () => {
    if (!EMAIL_RE.test(email.trim())) return 'Format email belum benar.';
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (e) return 'Gagal mengirim tautan. Coba lagi sebentar lagi.';
    setSent(true);
    return null;
  });
  return (
    <AuthFrame title="Lupa password" subtitle={sent ? 'Jika email itu terdaftar, tautan untuk membuat password baru sudah dikirim.' : 'Masukkan email akunmu. Kami kirim tautan untuk membuat password baru.'} footer={<Alt q="Ingat password?" label="Masuk" href="/masuk" />}>
      {sent ? null : (
        <>
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" inputMode="email" onSubmitEditing={submit} error={error ?? undefined} />
          <Button label="Kirim tautan" size="lg" fullWidth loading={busy} disabled={!email} onPress={submit} />
        </>
      )}
    </AuthFrame>
  );
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, run } = useAction();
  const submit = () => run(async () => {
    if (password.length < 8) return 'Password minimal 8 karakter.';
    if (password !== confirm) return 'Konfirmasi password tidak sama.';
    const { error: e } = await supabase.auth.updateUser({ password });
    if (e) return 'Gagal menyimpan password. Minta tautan baru.';
    router.replace('/app');
    return null;
  });
  if (!loading && !session) {
    return (
      <AuthFrame title="Tautan tidak berlaku" subtitle="Tautan reset sudah kedaluwarsa atau sudah dipakai." footer={<Alt q="" label="Minta tautan baru" href="/lupa-password" />}>
        <View />
      </AuthFrame>
    );
  }
  return (
    <AuthFrame title="Password baru" subtitle="Pilih password baru untuk akunmu.">
      <TextField label="Password baru" hint="Minimal 8 karakter." value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <TextField label="Ulangi password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" onSubmitEditing={submit} error={error ?? undefined} />
      <Button label="Simpan password" size="lg" fullWidth loading={busy} disabled={!password || !confirm} onPress={submit} />
    </AuthFrame>
  );
}

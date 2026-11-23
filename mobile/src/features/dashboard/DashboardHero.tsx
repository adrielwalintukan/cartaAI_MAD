import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button, Text } from '../../components/ui';
import { useTheme } from '../../theme';

const today = () => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());

/** Sapaan bergaya judul landing: huruf display besar, nama miring berwarna aksen. */
export function DashboardHero({ name, status, onPlans }: { name?: string; status: string; onPlans: () => void }) {
  const router = useRouter();
  const { space, t, colors, bp } = useTheme();
  const big = bp === 'mobile' ? { fontSize: 44, lineHeight: 48 } : { fontSize: 72, lineHeight: 74 };
  return (
    <View style={{ gap: space[4] }}>
      <Text variant="overline" color="textMuted">{today()}</Text>
      <Text accessibilityRole="header" style={{ ...t('display'), ...big, letterSpacing: -1.5 }}>
        Halo{name ? ', ' : ''}
        {name ? <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', ...big, color: colors.accent }}>{name}</Text> : null}.
      </Text>
      <Text color="textMuted" style={{ maxWidth: 520 }}>{status}</Text>
      <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap', marginTop: space[2] }}>
        <Button label="Buat undangan" iconLeft="plus" size="lg" onPress={() => router.push('/app/undangan/baru')} />
        <Button label="Lihat paket" variant="secondary" size="lg" onPress={onPlans} />
      </View>
    </View>
  );
}

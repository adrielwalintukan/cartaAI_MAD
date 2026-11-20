import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { PricingCard } from '../../components/domain';
import { Logotype, Navbar } from '../../components/layout';
import { Button, Card, Text } from '../../components/ui';
import { FREE_FEATURES, PREMIUM_FEATURES, PREMIUM_PRICE } from '../../lib/plans';
import { maxWidth, useTheme } from '../../theme';
import { useAuth } from '../auth';

function Frame({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { session } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Navbar signedIn={!!session} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {children}
        <Footer />
      </ScrollView>
    </View>
  );
}

function Section({ children, tone }: { children: React.ReactNode; tone?: 'sunken' }) {
  const { colors, gutter, space, bp } = useTheme();
  return (
    <View style={{ backgroundColor: tone === 'sunken' ? colors.surfaceSunken : colors.bg }}>
      <View style={{ width: '100%', maxWidth: maxWidth.content, alignSelf: 'center', paddingHorizontal: gutter, paddingVertical: bp === 'mobile' ? space[12] : space[16], gap: space[8] }}>{children}</View>
    </View>
  );
}

function Footer() {
  const { colors, gutter, space } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
      <View style={{ width: '100%', maxWidth: maxWidth.content, alignSelf: 'center', paddingHorizontal: gutter, paddingVertical: space[8], flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space[4] }}>
        <Logotype />
        <Text variant="bodySm" color="textMuted">Undangan pernikahan digital yang disusun AI. © {new Date().getFullYear()} CartaAI</Text>
      </View>
    </View>
  );
}

const STEPS = [
  { n: '1', title: 'Isi data pernikahan', body: 'Nama, orang tua, tanggal, dan lokasi. Cukup beberapa menit.' },
  { n: '2', title: 'AI menyusun undangannya', body: 'Desain dibuat khusus dari data dan gaya yang kamu pilih. Bukan template yang sama untuk semua orang.' },
  { n: '3', title: 'Bagikan link ke tamu', body: 'Setiap tamu mendapat link pribadi. Kirim lewat WhatsApp dan pantau RSVP-nya.' },
];

const STYLES = [
  { name: 'Editorial Romantis', body: 'Hangat dan rapi, huruf serif, warna gading.', image: require('../../../assets/templates/elegan_2.png') },
  { name: 'Elegan', body: 'Mewah dengan aksen emas dan bingkai halus.', image: require('../../../assets/templates/elegan_1.png') },
  { name: 'Formal', body: 'Resmi, simetris, dan tertata.', image: require('../../../assets/templates/formal_1.png') },
  { name: 'Simple', body: 'Bersih, minimalis, banyak ruang kosong.', image: require('../../../assets/templates/simple_1.png') },
];

function StyleGrid() {
  const { space, radius, colors, bp } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[6] }}>
      {STYLES.map((s) => (
        <View key={s.name} style={{ flexBasis: bp === 'mobile' ? '100%' : bp === 'tablet' ? '47%' : '23%', flexGrow: 1, gap: space[3] }}>
          <Image source={s.image} contentFit="cover" accessibilityLabel={`Contoh gaya ${s.name}`} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }} />
          <Text variant="h3">{s.name}</Text>
          <Text color="textMuted">{s.body}</Text>
        </View>
      ))}
    </View>
  );
}

function Plans() {
  const { space, bp } = useTheme();
  return (
    <View style={{ flexDirection: bp === 'mobile' ? 'column' : 'row', gap: space[6], alignItems: bp === 'mobile' ? 'stretch' : 'flex-start' }}>
      <PricingCard name="Gratis" price={0} priceNote="selamanya" description="Untuk undangan sederhana yang tetap lengkap." features={FREE_FEATURES} ctaLabel="Mulai gratis" href="/daftar" />
      <PricingCard name="Premium" price={PREMIUM_PRICE} priceNote="sekali bayar per undangan" description="Foto, galeri, musik, dan tampilan tanpa watermark." features={PREMIUM_FEATURES} ctaLabel="Buat undangan dulu" href="/daftar" highlighted badge="Paling lengkap" />
    </View>
  );
}

export function LandingScreen() {
  const { space, bp } = useTheme();
  return (
    <Frame>
      <Section>
        <View style={{ gap: space[6], maxWidth: 760 }}>
          <Text variant="overline" color="accent">Undangan pernikahan digital</Text>
          <Text variant="display">
            Undangan pernikahanmu, <Text inline italic color="accent">siap dibagikan</Text> dalam hitungan menit.
          </Text>
          <Text variant="bodyLg" color="textMuted">Isi data pernikahan, AI menyusun undangan yang dirancang khusus untukmu, lalu bagikan lewat satu link.</Text>
          <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
            <Button label="Buat undangan gratis" size="lg" href="/daftar" />
            <Button label="Lihat gaya" size="lg" variant="secondary" href="/gaya" />
          </View>
          <Text variant="bodySm" color="textMuted">Tanpa kartu kredit. Gratis 30 hari.</Text>
        </View>
      </Section>
      <Section tone="sunken">
        <Text variant="h2">Cara kerjanya</Text>
        <View style={{ flexDirection: bp === 'mobile' ? 'column' : 'row', gap: space[6] }}>
          {STEPS.map((s) => (
            <Card key={s.n} style={{ flex: 1, gap: space[2] }}>
              <Text variant="overline" color="accent">Langkah {s.n}</Text>
              <Text variant="h3">{s.title}</Text>
              <Text color="textMuted">{s.body}</Text>
            </Card>
          ))}
        </View>
      </Section>
      <Section>
        <Text variant="h2">Beberapa gaya untuk dipilih</Text>
        <StyleGrid />
      </Section>
      <Section tone="sunken">
        <Text variant="h2">Harga yang jelas</Text>
        <Plans />
      </Section>
      <Section>
        <View style={{ gap: space[4], maxWidth: 600 }}>
          <Text variant="h2">Mulai dari datamu.</Text>
          <Text color="textMuted">Undangan pertama gratis dan bisa ditingkatkan kapan saja.</Text>
          <View style={{ flexDirection: 'row' }}><Button label="Buat undangan gratis" size="lg" href="/daftar" /></View>
        </View>
      </Section>
    </Frame>
  );
}

export function PricingScreen() {
  return (
    <Frame>
      <Section>
        <Text variant="h1">Harga</Text>
        <Text color="textMuted" style={{ maxWidth: 560 }}>Bayar sekali untuk satu undangan. Tidak ada langganan dan tidak ada biaya tersembunyi.</Text>
        <Plans />
      </Section>
    </Frame>
  );
}

export function StylesScreen() {
  return (
    <Frame>
      <Section>
        <Text variant="h1">Gaya undangan</Text>
        <Text color="textMuted" style={{ maxWidth: 560 }}>Gaya adalah arahan untuk AI: palet, suasana, dan huruf. Hasil akhirnya tetap disusun khusus dari datamu.</Text>
        <StyleGrid />
        <View style={{ flexDirection: 'row' }}><Button label="Buat undangan gratis" size="lg" href="/daftar" /></View>
      </Section>
    </Frame>
  );
}

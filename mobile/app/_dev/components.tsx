import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Navbar, Sidebar, TabBar } from '../../src/components/layout';
import { GuestRow, InvitationCard, PricingCard } from '../../src/components/domain';
import {
  Badge, Button, Card, Chip, DatePicker, EmptyState, Modal, ProgressSteps, Screen, Segmented, Select, Skeleton,
  SkeletonGroup, Tabs, Text, TextArea, TextField, useToast, type BadgeTone,
} from '../../src/components/ui';
import { type Colors, type TypeVariant, type Scheme, useTheme } from '../../src/theme';

const TYPES: TypeVariant[] = ['display', 'h1', 'h2', 'h3', 'bodyLg', 'body', 'bodySm', 'label', 'caption', 'overline'];
const SWATCHES: (keyof Colors)[] = [
  'bg', 'surface', 'surfaceRaised', 'surfaceSunken', 'text', 'textMuted', 'textSubtle', 'border', 'borderStrong', 'accent', 'accentHover',
  'onAccent', 'accentSoft', 'onAccentSoft', 'inverse', 'onInverse', 'success', 'warning', 'danger', 'info', 'successSoft', 'warningSoft', 'dangerSoft', 'infoSoft',
];
const TONES: BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { space, colors } = useTheme();
  return (
    <View style={{ gap: space[4], paddingTop: space[8], marginTop: space[8], borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text variant="h2">{title}</Text>
      {children}
    </View>
  );
}
const Row = ({ children }: { children: React.ReactNode }) => {
  const { space } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3], alignItems: 'center' }}>{children}</View>;
};

// Rute dev (docs/08 F2-2): tidak tersedia di build produksi.
export default function DevComponents() {
  if (process.env.NODE_ENV === 'production') return <Redirect href="/" />;
  return <Gallery />;
}

function Gallery() {
  const { colors, space, radius, scheme, setScheme, isDark, bp } = useTheme();
  const toast = useToast();
  const [tab, setTab] = useState('a');
  const [seg, setSeg] = useState('bulan');
  const [chip, setChip] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [date, setDate] = useState('2026-12-12');
  const [time, setTime] = useState('09:00');
  const [sheet, setSheet] = useState(false);
  const [text, setText] = useState('');

  return (
    <Screen style={{ paddingVertical: space[8] }}>
      <Text variant="overline" color="accent">Dev · design system</Text>
      <Text variant="display" style={{ marginTop: space[2] }}>Komponen <Text inline italic color="accent">CartaAI</Text></Text>
      <Text variant="bodyLg" color="textMuted" style={{ marginTop: space[3], maxWidth: 680 }}>
        Semua komponen dasar, {isDark ? 'gelap' : 'terang'}, breakpoint {bp}.
      </Text>
      <View style={{ marginTop: space[6], maxWidth: 360 }}>
        <Segmented label="Tema" value={scheme} onChange={(v) => setScheme(v as Scheme)} options={[{ value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }, { value: 'system', label: 'Sistem' }]} />
      </View>

      <Section title="Palet">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {SWATCHES.map((k) => (
            <View key={k} style={{ width: 120 }}>
              <View style={{ height: 40, borderRadius: radius.md, backgroundColor: colors[k], borderWidth: 1, borderColor: colors.border }} />
              <Text variant="caption" color="textMuted">{k}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Tipografi">
        {TYPES.map((v) => <Text key={v} variant={v}>{v} · Undangan pernikahanmu, siap dibagikan</Text>)}
      </Section>

      <Section title="Button">
        <Row>
          <Button label="Buat undangan" />
          <Button label="Simpan" variant="secondary" />
          <Button label="Lihat contoh" variant="ghost" />
          <Button label="Hapus" variant="danger" />
          <Button label="Pelajari" variant="link" />
        </Row>
        <Row>
          <Button label="Kecil" size="sm" /><Button label="Sedang" size="md" /><Button label="Besar" size="lg" />
          <Button label="Dengan ikon" iconLeft="send" iconRight="arrow-right" />
        </Row>
        <Row>
          <Button label="Memproses" loading /><Button label="Nonaktif" disabled /><Button label="Nonaktif" variant="secondary" disabled />
        </Row>
        <Button label="Lebar penuh" size="lg" fullWidth />
      </Section>

      <Section title="Form">
        <View style={{ gap: space[4], maxWidth: 560 }}>
          <TextField label="Nama mempelai pria" value={text} onChangeText={setText} placeholder="Adriel" maxLength={60} />
          <TextField label="Email" hint="Kami kirim tautan konfirmasi ke sini." keyboardType="email-address" />
          <TextField label="Nama panggilan" optional />
          <TextField label="Lokasi" error="Isi lokasi acara." value="" />
          <TextField label="Dikunci" disabled value="Tidak bisa diubah" />
          <TextArea label="Kata pengantar" optional placeholder="Mohon hadir tepat waktu." />
          <Select label="Agama" value={sel} onChange={setSel} options={[{ value: 'islam', label: 'Islam' }, { value: 'kristen', label: 'Kristen' }, { value: 'katolik', label: 'Katolik' }]} />
          <DatePicker label="Tanggal acara" value={date} onChange={setDate} />
          <DatePicker label="Jam akad" mode="time" value={time} onChange={setTime} />
        </View>
      </Section>

      <Section title="Card, Badge, Chip">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[4] }}>
          <Card style={{ width: 240 }}><Text variant="h3">Kartu biasa</Text><Text variant="bodySm" color="textMuted">Border 1px, tanpa bayangan.</Text></Card>
          <Card variant="interactive" onPress={() => toast.show({ message: 'Kartu ditekan', variant: 'info' })} accessibilityLabel="Kartu interaktif" style={{ width: 240 }}><Text variant="h3">Interaktif</Text><Text variant="bodySm" color="textMuted">Hover menebalkan garis.</Text></Card>
          <Card variant="sunken" style={{ width: 240 }}><Text variant="h3">Cekung</Text><Text variant="bodySm" color="textMuted">Untuk ringkasan.</Text></Card>
        </View>
        <Row>{TONES.map((t) => <Badge key={t} label={t === 'accent' ? 'Premium' : t} tone={t} />)}</Row>
        <Row><Chip label="Hadir" selected={chip} onPress={() => setChip(!chip)} /><Chip label="Belum dibuka" /></Row>
      </Section>

      <Section title="Tabs dan Segmented">
        <Tabs label="Bagian" value={tab} onChange={setTab} options={[{ value: 'a', label: 'Ringkasan' }, { value: 'b', label: 'Tamu' }, { value: 'c', label: 'RSVP' }]} />
        <View style={{ maxWidth: 320 }}><Segmented label="Periode" value={seg} onChange={setSeg} options={[{ value: 'bulan', label: 'Bulanan' }, { value: 'tahun', label: 'Tahunan' }]} /></View>
      </Section>

      <Section title="Modal, sheet, toast">
        <Row>
          <Button label="Buka modal" variant="secondary" onPress={() => setSheet(true)} />
          <Button label="Toast sukses" variant="secondary" onPress={() => toast.show({ message: 'Link undangan disalin.', variant: 'success', actionLabel: 'Urungkan' })} />
          <Button label="Toast galat" variant="secondary" onPress={() => toast.show({ message: 'Undangan belum bisa dibuat. Periksa koneksi lalu coba lagi.', variant: 'error' })} />
          <Button label="Toast info" variant="secondary" onPress={() => toast.show({ message: 'Menyimpan draf.', variant: 'info' })} />
        </Row>
        <Modal visible={sheet} onClose={() => setSheet(false)} title="Hapus undangan ini?" footer={<><Button label="Batal" variant="secondary" onPress={() => setSheet(false)} /><Button label="Hapus" variant="danger" onPress={() => setSheet(false)} /></>}>
          <Text color="textMuted">Linknya akan berhenti aktif.</Text>
        </Modal>
      </Section>

      <Section title="Empty, error, skeleton">
        <Card><EmptyState title="Belum ada undangan" description="Mulai dari data mempelai." actionLabel="Buat undangan" onAction={() => undefined} /></Card>
        <Card><EmptyState variant="error" title="Belum bisa memuat" description="Periksa koneksi lalu coba lagi." actionLabel="Coba lagi" onAction={() => undefined} /></Card>
        <Card>
          <SkeletonGroup>
            <View style={{ flexDirection: 'row', gap: space[4] }}>
              <Skeleton width={72} height={90} radius="md" />
              <View style={{ flex: 1, gap: space[2] }}><Skeleton width="60%" height={20} /><Skeleton width="40%" /><Skeleton width={80} height={24} /></View>
            </View>
          </SkeletonGroup>
        </Card>
      </Section>

      <Section title="ProgressSteps">
        <ProgressSteps variant="stepper" current={1} steps={[{ key: '1', label: 'Mempelai' }, { key: '2', label: 'Acara' }, { key: '3', label: 'Gaya' }, { key: '4', label: 'Tambahan' }, { key: '5', label: 'Tinjau' }]} />
        <Card>
          <ProgressSteps variant="job" hint="Biasanya 20-40 detik." steps={[
            { key: 'a', label: 'Data diterima', status: 'done' }, { key: 'b', label: 'Menyusun desain', status: 'running' },
            { key: 'c', label: 'Memeriksa hasil', status: 'waiting' }, { key: 'd', label: 'Menyiapkan link', status: 'waiting' },
          ]} />
        </Card>
        <Card>
          <ProgressSteps variant="job" steps={[{ key: 'a', label: 'Data diterima', status: 'done' }, { key: 'b', label: 'Menyusun desain', status: 'failed' }]} />
        </Card>
      </Section>

      <Section title="Harga">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[4] }}>
          <PricingCard name="Gratis" price={0} priceNote="selamanya" description="Cukup untuk undangan sederhana." ctaLabel="Mulai gratis" features={[
            { text: 'Data inti pernikahan', included: true }, { text: 'Aktif 30 hari', included: true }, { text: 'Maksimal 50 tamu', included: true }, { text: 'Foto dan musik', included: false }]} />
          <PricingCard highlighted badge="Paling dipilih" name="Premium" price={99000} priceNote="sekali bayar per undangan" description="Tambah foto, galeri, dan musik." ctaLabel="Pilih Premium" features={[
            { text: 'Foto dan galeri (maks 10)', included: true }, { text: 'Musik latar', included: true }, { text: 'Tanpa watermark', included: true }, { text: 'Aktif 1 tahun', included: true }]} />
        </View>
      </Section>

      <Section title="Undangan dan tamu">
        <View style={{ maxWidth: 520, gap: space[4] }}>
          <InvitationCard title="Rina & Dimas" subtitle="12 Des 2026 · rina-dimas" status={{ label: 'Aktif', tone: 'success' }} plan="Premium" expiryLabel="Aktif sampai 12 Jan 2027" onOpen={() => undefined}
            primary={{ label: 'Salin link', onPress: () => toast.show({ message: 'Link disalin.', variant: 'success' }) }} secondary={{ label: 'Tamu', onPress: () => undefined }}
            menu={[{ label: 'Edit data', onPress: () => undefined }, { label: 'Generate ulang (2 dari 3)', onPress: () => undefined }, { label: 'Hapus', onPress: () => undefined, danger: true }]} />
          <InvitationCard title="Adriel & Tiara" subtitle="Draf · adriel-tiara" status={{ label: 'Draf', tone: 'neutral' }} plan="Gratis" expiryLabel="Aktif sampai 20 Nov 2026" expirySoon onOpen={() => undefined} primary={{ label: 'Lanjutkan', onPress: () => undefined }} />
        </View>
        <Card style={{ maxWidth: 720 }}>
          <GuestRow name="Pak Joko Santoso" detail="+62 812 3456 789 · Keluarga" rsvp="hadir" onSendWhatsApp={() => undefined} menu={[{ label: 'Salin link personal', onPress: () => undefined }, { label: 'Hapus', onPress: () => undefined, danger: true }]} />
          <GuestRow name="Bu Sari" detail="Teman kantor" rsvp="belum" onSendWhatsApp={() => undefined} />
          <GuestRow name="Rudi" rsvp="tidak_hadir" />
        </Card>
      </Section>

      <Section title="Navigasi">
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' }}><Navbar /></View>
        <View style={{ height: 360, flexDirection: 'row', gap: space[4] }}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' }}><Sidebar pathname="/app/undangan" active="list" userLabel="adriel@example.com" /></View>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' }}><Sidebar pathname="/app" active="home" compact /></View>
        </View>
        <View style={{ maxWidth: 420, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' }}><TabBar active="new" /></View>
      </Section>
    </Screen>
  );
}

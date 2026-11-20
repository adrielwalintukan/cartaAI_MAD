import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Badge, Button, Card, DatePicker, EmptyState, ProgressSteps, Screen, Select, Skeleton, Text, TextField, useToast } from '../../../components/ui';
import { useTheme } from '../../../theme';
import type { InvitationData, Invitation, Party } from '../../../types/api';
import { useStartGenerate } from '../../generator/hooks';
import { invitationsApi } from '../api';
import { useInvitation, useInvitationMutations } from '../hooks';
import { usePresets } from '../../presets/hooks';
import { errMsg, slugify } from '../ui';
import { AssetUploader } from './AssetUploader';

type Data = Partial<InvitationData>;
const STEPS = [{ key: 'gaya', label: 'Gaya' }, { key: 'mempelai', label: 'Mempelai' }, { key: 'acara', label: 'Acara' }, { key: 'tambahan', label: 'Tambahan' }];
const RELIGIONS = ['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu', 'lainnya'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const ZONES = ['WIB', 'WITA', 'WIT'].map((v) => ({ value: v, label: v }));
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function PartyFields({ title, value, onChange }: { title: string; value?: Party; onChange: (p: Party) => void }) {
  const { space } = useTheme();
  const p = value ?? { name: '' };
  return (
    <Card style={{ gap: space[4] }}>
      <Text variant="h3">{title}</Text>
      <TextField label="Nama lengkap" value={p.name} onChangeText={(name) => onChange({ ...p, name })} autoComplete="name" />
      <TextField label="Nama ayah" optional value={p.father ?? ''} onChangeText={(father) => onChange({ ...p, father })} />
      <TextField label="Nama ibu" optional value={p.mother ?? ''} onChangeText={(mother) => onChange({ ...p, mother })} />
    </Card>
  );
}

/** Wizard tunggal untuk buat dan ubah. Mode ubah memuat data dari server dan membuka unggahan bila Premium. */
export function InvitationFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const existing = useInvitation(mode === 'edit' ? id : undefined);
  const presets = usePresets();
  const { create, update } = useInvitationMutations();
  const start = useStartGenerate();

  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState('');
  const [presetId, setPresetId] = useState('default');
  const [data, setData] = useState<Data>({ timezone: 'WIB' });
  const [slugState, setSlugState] = useState<'idle' | 'ok' | 'taken' | 'bad'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const loaded = useRef(false);

  useEffect(() => {
    if (mode === 'edit' && existing.data && !loaded.current) {
      loaded.current = true;
      setSlug(existing.data.slug); setPresetId(existing.data.preset_id); setData(existing.data.data);
    }
  }, [mode, existing.data]);

  if (mode === 'edit' && existing.isLoading) return <Screen width="form" style={{ paddingVertical: space[8], gap: space[4] }}><Skeleton height={32} width="50%" /><Skeleton height={220} radius="lg" /></Screen>;
  if (mode === 'edit' && (existing.isError || !existing.data)) return <Screen><EmptyState variant="error" title="Undangan tidak ditemukan" actionLabel="Kembali" onAction={() => router.replace('/app/undangan')} /></Screen>;

  const inv: Invitation | undefined = existing.data;
  const premium = (inv?.plan ?? 'free') === 'premium';
  const set = (patch: Data) => setData((d) => ({ ...d, ...patch }));

  const checkSlug = async () => {
    if (mode === 'edit') return;
    if (!SLUG_RE.test(slug) || slug.length < 3 || slug.length > 40) return setSlugState('bad');
    try { setSlugState((await invitationsApi.slugAvailable(slug)).available ? 'ok' : 'taken'); } catch { setSlugState('idle'); }
  };

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0 && mode === 'create') {
      if (!SLUG_RE.test(slug) || slug.length < 3 || slug.length > 40) e.slug = 'Gunakan 3-40 huruf kecil, angka, atau tanda hubung (contoh: adriel-tiara).';
      else if (slugState === 'taken') e.slug = 'Alamat ini sudah dipakai. Coba yang lain.';
    }
    if (s === 1) {
      if (!data.groom?.name?.trim()) e.groom = 'Nama mempelai pria wajib diisi.';
      if (!data.bride?.name?.trim()) e.bride = 'Nama mempelai wanita wajib diisi.';
    }
    if (s === 2) {
      if (!data.event_date) e.event_date = 'Tanggal acara wajib diisi.';
      else if (data.event_date < new Date().toISOString().slice(0, 10)) e.event_date = 'Tanggal sudah lewat.';
      if (!data.ceremony?.location?.trim()) e.location = 'Lokasi acara wajib diisi.';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if (validate(step)) setStep((s) => s + 1); };

  const save = (thenGenerate: boolean) => {
    if (![0, 1, 2].every(validate)) { toast.show({ message: 'Ada isian wajib yang belum lengkap.', variant: 'error' }); return; }
    const done = (invId: string) => {
      if (!thenGenerate) return router.replace(`/app/undangan/${invId}` as never);
      start.mutate(invId, {
        onSuccess: (r) => router.replace(`/app/undangan/${invId}/proses/${r.job_id}` as never),
        onError: (e) => { toast.show({ message: errMsg(e), variant: 'error' }); router.replace(`/app/undangan/${invId}` as never); },
      });
    };
    const fail = (e: unknown) => toast.show({ message: errMsg(e), variant: 'error' });
    if (mode === 'create') create.mutate({ slug, preset_id: presetId, data }, { onSuccess: (r) => done(r.id), onError: fail });
    else update.mutate({ id: id!, data, preset_id: presetId }, { onSuccess: (r) => done(r.id), onError: fail });
  };
  const saving = create.isPending || update.isPending || start.isPending;
  const gifts = data.gifts ?? [];

  return (
    <Screen width="form" style={{ paddingVertical: space[8], gap: space[6] }}>
      <Text variant="h1">{mode === 'create' ? 'Buat undangan' : 'Ubah data undangan'}</Text>
      <ProgressSteps variant="stepper" steps={STEPS} current={step} />

      {step === 0 ? (
        <View style={{ gap: space[6] }}>
          <TextField
            label="Alamat undangan"
            hint={`Link jadi /u/${slug || 'nama-kalian'}. Tidak bisa diganti setelah dibuat.`}
            value={slug}
            onChangeText={(v) => { setSlug(slugify(v)); setSlugState('idle'); }}
            onBlur={checkSlug}
            editable={mode === 'create'}
            autoCapitalize="none"
            error={errors.slug ?? (slugState === 'taken' ? 'Alamat ini sudah dipakai.' : slugState === 'bad' ? 'Format belum benar.' : undefined)}
          />
          {slugState === 'ok' ? <Text variant="bodySm" color="success">Alamat tersedia.</Text> : null}
          <View style={{ gap: space[3] }}>
            <Text variant="label">Gaya desain</Text>
            <Text variant="bodySm" color="textMuted">Arahan untuk AI: palet, suasana, dan huruf. Gaya lain tersedia di paket Premium.</Text>
            {(presets.data?.items ?? []).map((p) => {
              const locked = p.premium_only && !premium;
              return (
                <Card key={p.id} variant="interactive" selected={presetId === p.id} accessibilityLabel={`${p.name}. ${p.description}${locked ? '. Khusus Premium' : ''}`} onPress={() => (locked ? toast.show({ message: 'Gaya ini khusus Premium.', variant: 'info' }) : setPresetId(p.id))} style={{ gap: space[1], opacity: locked ? 0.6 : 1 }}>
                  <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'center' }}><Text variant="h3">{p.name}</Text>{p.premium_only ? <Badge label="Premium" tone="accent" /> : null}</View>
                  <Text color="textMuted">{p.description}</Text>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: space[6] }}>
          <PartyFields title="Mempelai pria" value={data.groom} onChange={(groom) => set({ groom })} />
          {errors.groom ? <Text variant="bodySm" color="danger">{errors.groom}</Text> : null}
          <PartyFields title="Mempelai wanita" value={data.bride} onChange={(bride) => set({ bride })} />
          {errors.bride ? <Text variant="bodySm" color="danger">{errors.bride}</Text> : null}
          <Select label="Agama" optional value={(data.religion as string) ?? null} options={RELIGIONS} onChange={(v) => set({ religion: v as InvitationData['religion'] })} hint="Mengatur salam dan kalimat pembuka." />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: space[6] }}>
          <Card style={{ gap: space[4] }}>
            <Text variant="h3">Akad / pemberkatan</Text>
            <DatePicker label="Tanggal acara" value={data.event_date ?? ''} onChange={(event_date) => set({ event_date })} error={errors.event_date} />
            <DatePicker label="Jam" mode="time" optional value={data.ceremony?.time ?? ''} onChange={(time) => set({ ceremony: { ...data.ceremony, location: data.ceremony?.location ?? '', time } })} />
            <Select label="Zona waktu" value={data.timezone ?? 'WIB'} options={ZONES} onChange={(v) => set({ timezone: v as InvitationData['timezone'] })} />
            <TextField label="Lokasi" hint="Nama tempat dan alamat. Tombol Google Maps dibuat otomatis." value={data.ceremony?.location ?? ''} onChangeText={(location) => set({ ceremony: { ...data.ceremony, location } })} error={errors.location} multiline />
          </Card>
          <Card style={{ gap: space[4] }}>
            <Text variant="h3">Resepsi</Text>
            <DatePicker label="Jam" mode="time" optional value={data.reception?.time ?? ''} onChange={(time) => set({ reception: { location: data.reception?.location ?? '', time } })} />
            <TextField label="Lokasi" optional value={data.reception?.location ?? ''} onChangeText={(location) => set({ reception: { ...data.reception, location } })} multiline />
          </Card>
          <TextField label="Catatan untuk AI" optional hint="Mis. kisah singkat, kutipan, atau permintaan khusus." value={data.notes ?? ''} onChangeText={(notes) => set({ notes })} multiline />
        </View>
      ) : null}

      {step === 3 ? (
        premium && inv ? (
          <View style={{ gap: space[6] }}>
            <TextField label="Tema warna" optional hint="Mis. sage green dan krem, atau biru dongker." value={data.color_theme ?? ''} onChangeText={(color_theme) => set({ color_theme })} />
            <AssetUploader inv={inv} kind="cover" label="Foto sampul" />
            <AssetUploader inv={inv} kind="groom" label="Foto mempelai pria" />
            <AssetUploader inv={inv} kind="bride" label="Foto mempelai wanita" />
            <AssetUploader inv={inv} kind="gallery" label="Galeri" multi max={10} />
            <AssetUploader inv={inv} kind="music" label="Musik latar" />
            <Card style={{ gap: space[4] }}>
              <Text variant="h3">Amplop digital</Text>
              {gifts.map((g, i) => (
                <View key={i} style={{ gap: space[3] }}>
                  <TextField label="Bank atau e-wallet" value={g.bank} onChangeText={(bank) => set({ gifts: gifts.map((x, j) => (j === i ? { ...x, bank } : x)) })} />
                  <TextField label="Nomor rekening" value={g.account_number} inputMode="numeric" onChangeText={(account_number) => set({ gifts: gifts.map((x, j) => (j === i ? { ...x, account_number } : x)) })} />
                  <TextField label="Atas nama" value={g.account_name} onChangeText={(account_name) => set({ gifts: gifts.map((x, j) => (j === i ? { ...x, account_name } : x)) })} />
                  <View style={{ flexDirection: 'row' }}><Button label="Hapus rekening" size="sm" variant="ghost" onPress={() => set({ gifts: gifts.filter((_, j) => j !== i) })} /></View>
                </View>
              ))}
              {gifts.length < 5 ? <View style={{ flexDirection: 'row' }}><Button label="Tambah rekening" variant="secondary" iconLeft="plus" onPress={() => set({ gifts: [...gifts, { bank: '', account_number: '', account_name: '' }] })} /></View> : null}
            </Card>
          </View>
        ) : (
          <Card variant="sunken" style={{ gap: space[3] }}>
            <Text variant="h3">Khusus Premium</Text>
            <Text color="textMuted">Foto, galeri, musik, tema warna, dan amplop digital tersedia setelah undangan ini di-upgrade. Undangan gratismu tetap lengkap: nama, acara, lokasi, RSVP, dan hitung mundur.</Text>
          </Card>
        )
      ) : null}

      <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Button label="Kembali" variant="ghost" disabled={step === 0 || saving} onPress={() => setStep((s) => s - 1)} />
        {step < STEPS.length - 1 ? (
          <Button label="Lanjut" onPress={next} />
        ) : (
          <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
            <Button label="Simpan draf" variant="secondary" loading={saving} onPress={() => save(false)} />
            <Button label="Simpan dan buat undangan" loading={saving} onPress={() => save(true)} />
          </View>
        )}
      </View>
    </Screen>
  );
}

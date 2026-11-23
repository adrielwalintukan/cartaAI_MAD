import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { GuestRow } from '../../../components/domain';
import { Badge, Button, Card, EmptyState, Modal, Screen, Skeleton, Text, TextArea, TextField, useToast } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { errMsg, openUrl } from '../../invitations/ui';
import { useInvitation } from '../../invitations/hooks';
import { useHideRsvp, useRsvps } from '../../rsvp/hooks';
import { useGuestMutations, useGuests } from '../hooks';

const DEFAULT_TEMPLATE = 'Assalamualaikum {nama},\n\nDengan penuh syukur, kami mengundang Anda ke acara pernikahan kami. Detail acara dan konfirmasi kehadiran ada di tautan berikut:\n{link}\n\nTerima kasih.';

/** 0812… → 62812…; selain angka dibuang. */
const waNumber = (p: string) => { const d = p.replace(/\D/g, ''); return d.startsWith('0') ? '62' + d.slice(1) : d; };

/** Baris "Nama, 0812…" atau "Nama;0812…" atau tab (tempel dari spreadsheet). Baris kosong dilewati. */
export function parseGuests(text: string) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name, phone] = l.split(/[,;\t]/).map((s) => s.trim());
    return phone ? { name, phone } : { name };
  }).filter((g) => g.name);
}

export function GuestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { space } = useTheme();
  const inv = useInvitation(id);
  const guests = useGuests(id);
  const m = useGuestMutations(id!);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [tpl, setTpl] = useState(DEFAULT_TEMPLATE);
  const [tplOpen, setTplOpen] = useState(false);
  const fail = (e: unknown) => toast.show({ message: errMsg(e), variant: 'error' });

  const add = () => m.create.mutate({ name: name.trim(), phone: phone.trim() || undefined }, { onSuccess: () => { setName(''); setPhone(''); }, onError: fail });
  const importBulk = () => {
    const list = parseGuests(bulkText);
    if (!list.length) return toast.show({ message: 'Belum ada nama yang bisa dibaca.', variant: 'error' });
    m.bulk.mutate(list, {
      onSuccess: (r) => { setBulkOpen(false); setBulkText(''); toast.show({ message: `${r.created} tamu ditambahkan${r.skipped ? `, ${r.skipped} dilewati` : ''}${r.rejected.length ? `, ${r.rejected.length} ditolak` : ''}.`, variant: r.rejected.length ? 'info' : 'success' }); },
      onError: fail,
    });
  };
  const send = (g: { name: string; phone: string | null; link: string }) => {
    if (!g.phone) return toast.show({ message: 'Tamu ini belum punya nomor WhatsApp.', variant: 'info' });
    const text = tpl.replaceAll('{nama}', g.name).replaceAll('{link}', g.link);
    openUrl(`https://wa.me/${waNumber(g.phone)}?text=${encodeURIComponent(text)}`);
  };

  const total = guests.data?.total ?? 0;
  const limit = guests.data?.limit;
  const live = inv.data?.status === 'published';

  return (
    <Screen width="prose" style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="h1">Daftar tamu</Text>
        <Text color="textMuted">Setiap tamu mendapat link pribadi. Namanya muncul di sampul undangan.{limit != null ? ` Paket Gratis: ${total} dari ${limit} tamu.` : ` ${total} tamu.`}</Text>
        {!live ? <Badge label="Link belum aktif: buat undangan dulu agar bisa dikirim" tone="warning" /> : null}
      </View>

      <Card style={{ gap: space[4] }}>
        <Text variant="h3">Tambah tamu</Text>
        <TextField label="Nama" value={name} onChangeText={setName} />
        <TextField label="Nomor WhatsApp" optional hint="Contoh 081234567890" inputMode="tel" value={phone} onChangeText={setPhone} />
        <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
          <Button label="Tambah" iconLeft="plus" loading={m.create.isPending} disabled={!name.trim()} onPress={add} />
          <Button label="Impor dari teks" variant="secondary" iconLeft="upload" onPress={() => setBulkOpen(true)} />
          <Button label="Pesan WhatsApp" variant="ghost" iconLeft="edit-3" onPress={() => setTplOpen(true)} />
        </View>
      </Card>

      {guests.isLoading ? <Skeleton height={64} radius="md" />
        : guests.isError ? <EmptyState variant="error" title="Tamu belum bisa dimuat" description={errMsg(guests.error)} actionLabel="Coba lagi" onAction={() => guests.refetch()} />
        : !guests.data?.items.length ? <EmptyState title="Belum ada tamu" description="Tambahkan satu per satu atau tempel daftar nama dari spreadsheet." />
        : (
          <View>
            {guests.data.items.map((g) => (
              <GuestRow
                key={g.id}
                name={g.name}
                detail={g.phone ?? 'Tanpa nomor'}
                rsvp={g.rsvp ?? 'belum'}
                onSendWhatsApp={live ? () => send(g) : undefined}
                menu={[
                  { label: 'Salin link pribadi', onPress: () => { if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(g.link); toast.show({ message: 'Link tamu disalin.', variant: 'success' }); } },
                  { label: 'Hapus', danger: true, onPress: () => m.remove.mutate(g.id, { onError: fail }) },
                ]}
              />
            ))}
          </View>
        )}

      <Modal
        visible={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Impor tamu"
        dismissOnScrim={false}
        footer={<View style={{ flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' }}><Button label="Batal" variant="secondary" onPress={() => setBulkOpen(false)} /><Button label="Impor" loading={m.bulk.isPending} onPress={importBulk} /></View>}
      >
        <TextArea label="Satu tamu per baris" hint="Format: Nama, Nomor. Nomor boleh dikosongkan. Bisa ditempel dari spreadsheet." value={bulkText} onChangeText={setBulkText} />
      </Modal>

      <Modal
        visible={tplOpen}
        onClose={() => setTplOpen(false)}
        title="Pesan WhatsApp"
        footer={<View style={{ flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' }}><Button label="Pulihkan bawaan" variant="ghost" onPress={() => setTpl(DEFAULT_TEMPLATE)} /><Button label="Selesai" onPress={() => setTplOpen(false)} /></View>}
      >
        <TextArea label="Isi pesan" hint="{nama} diganti nama tamu, {link} diganti link pribadinya." value={tpl} onChangeText={setTpl} />
      </Modal>
    </Screen>
  );
}

export function RsvpScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const q = useRsvps(id);
  const hide = useHideRsvp(id!);

  if (q.isLoading) return <Screen width="prose" style={{ paddingVertical: space[8] }}><Skeleton height={96} radius="lg" /></Screen>;
  if (q.isError || !q.data) return <Screen><EmptyState variant="error" title="RSVP belum bisa dimuat" description={q.error ? errMsg(q.error) : undefined} actionLabel="Coba lagi" onAction={() => q.refetch()} /></Screen>;
  const { stats, items } = q.data;
  const stat = (label: string, value: number) => (
    <Card style={{ flexGrow: 1, flexBasis: 140, gap: space[1] }}><Text variant="h2">{value}</Text><Text variant="bodySm" color="textMuted">{label}</Text></Card>
  );
  return (
    <Screen width="prose" style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="h1">RSVP dan ucapan</Text>
        <Text color="textMuted">Konfirmasi dan doa dari tamu. Ucapan yang disembunyikan tidak tampil di undangan.</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
        {stat('Hadir', stats.attending)}{stat('Tidak hadir', stats.not_attending)}{stat('Belum menjawab', stats.no_response)}{stat('Total tamu', stats.guests_total)}
      </View>
      {!items.length ? (
        <EmptyState title="Belum ada jawaban" description="Jawaban muncul di sini begitu tamu mengisi RSVP di undangan." actionLabel="Kirim ke tamu" onAction={() => router.push(`/app/undangan/${id}/tamu` as never)} />
      ) : items.map((r) => (
        <Card key={r.id} style={{ gap: space[2], opacity: r.is_hidden ? 0.6 : 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3] }}>
            <Text style={{ fontFamily: 'Inter_500Medium' }}>{r.name}</Text>
            <Badge label={r.attendance === 'hadir' ? 'Hadir' : 'Tidak hadir'} tone={r.attendance === 'hadir' ? 'success' : 'danger'} />
          </View>
          {r.message ? <Text color="textMuted">{r.message}</Text> : null}
          <View style={{ flexDirection: 'row' }}>
            <Button label={r.is_hidden ? 'Tampilkan' : 'Sembunyikan'} size="sm" variant="ghost" onPress={() => hide.mutate({ id: r.id, hidden: !r.is_hidden }, { onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }) })} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

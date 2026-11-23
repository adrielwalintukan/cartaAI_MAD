import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Badge, Button, Card, EmptyState, Modal, Screen, Skeleton, Text, useToast } from '../../../components/ui';
import { formatDateId } from '../../../lib/format';
import { useTheme } from '../../../theme';
import { useStartGenerate } from '../../generator/hooks';
import { useInvitation, useInvitationMutations } from '../hooks';
import { daysLeft, errMsg, openUrl, planLabel, shareLink, STATUS } from '../ui';

export function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const q = useInvitation(id);
  const start = useStartGenerate();
  const { rollback, remove } = useInvitationMutations();
  const [confirm, setConfirm] = useState<'rollback' | 'delete' | null>(null);
  const go = (sub: string) => router.push(`/app/undangan/${id}${sub}` as never);

  if (q.isLoading) return <Screen style={{ paddingVertical: space[8], gap: space[4] }}><Skeleton height={36} width="60%" /><Skeleton height={160} radius="lg" /></Screen>;
  if (q.isError || !q.data) return <Screen><EmptyState variant="error" title="Undangan tidak ditemukan" description={q.error ? errMsg(q.error) : undefined} actionLabel="Kembali" onAction={() => router.replace('/app/undangan')} /></Screen>;

  const inv = q.data;
  const st = STATUS[inv.status];
  const left = daysLeft(inv.expires_at);
  const { generations_used: used, generations_limit: limit } = inv.quota;
  const quotaLeft = limit - used;
  const hasResult = !!inv.current_version;

  const generate = () => start.mutate(inv.id, {
    onSuccess: (r) => go(`/proses/${r.job_id}`),
    onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }),
  });
  const copy = async () => {
    if (!inv.public_url) return;
    try { toast.show({ message: (await shareLink(inv.public_url)) === 'copied' ? 'Link disalin.' : 'Link dibagikan.', variant: 'success' }); }
    catch { toast.show({ message: 'Link belum bisa disalin.', variant: 'error' }); }
  };

  return (
    <Screen width="prose" style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <View style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap' }}>
          <Badge label={st.label} tone={st.tone} />
          <Badge label={planLabel(inv.plan)} tone={inv.plan === 'premium' ? 'accent' : 'neutral'} />
        </View>
        <Text variant="h1">{inv.title}</Text>
        <Text color="textMuted">{[inv.data.event_date ? formatDateId(inv.data.event_date) : null, inv.slug].filter(Boolean).join(' · ')}</Text>
      </View>

      {inv.active_job ? (
        <Card variant="sunken" style={{ gap: space[3] }}>
          <Text>Undangan sedang dibuat oleh AI.</Text>
          <View style={{ flexDirection: 'row' }}><Button label="Lihat progres" variant="secondary" onPress={() => go(`/proses/${inv.active_job!.id}`)} /></View>
        </Card>
      ) : null}

      <Card style={{ gap: space[4] }}>
        <Text variant="h3">Link undangan</Text>
        {inv.public_url && inv.status !== 'expired' ? (
          <>
            <Text selectable color="accent" style={{ fontFamily: 'Inter_500Medium' }}>{inv.public_url}</Text>
            <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
              <Button label="Salin link" iconLeft="copy" onPress={copy} />
              <Button label="Buka" iconLeft="external-link" variant="secondary" onPress={() => openUrl(inv.public_url!)} />
              <Button label="Kirim ke tamu" iconLeft="users" variant="secondary" onPress={() => go('/tamu')} />
            </View>
            {left != null ? <Text variant="bodySm" color={left <= 7 ? 'warning' : 'textMuted'}>{left > 0 ? `Aktif sampai ${formatDateId(inv.expires_at!)} (${left} hari lagi).` : 'Masa aktif sudah berakhir.'}</Text> : null}
          </>
        ) : (
          <Text color="textMuted">{inv.status === 'expired' ? 'Masa aktif link sudah berakhir. Upgrade untuk mengaktifkannya lagi.' : 'Link muncul di sini setelah undangan selesai dibuat.'}</Text>
        )}
        {inv.current_version?.warnings.length ? <Text variant="bodySm" color="warning">Catatan: {inv.current_version.warnings.join(' ')}</Text> : null}
      </Card>

      <Card style={{ gap: space[4] }}>
        <Text variant="h3">{hasResult ? 'Buat ulang undangan' : 'Buat undangan'}</Text>
        <Text color="textMuted">
          {hasResult ? 'Ubah data lalu minta AI menyusun ulang desainnya. Link tetap sama.' : 'Data sudah siap. Minta AI menyusun desainnya, biasanya selesai dalam satu menit.'}
          {' '}Kuota: {used} dari {limit} sudah dipakai.
        </Text>
        <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
          <Button label={hasResult ? 'Buat ulang' : 'Buat undangan'} loading={start.isPending} disabled={quotaLeft <= 0 || !!inv.active_job} onPress={generate} />
          <Button label="Ubah data" variant="secondary" onPress={() => go('/edit')} />
          {inv.has_previous_version ? <Button label="Kembali ke versi sebelumnya" variant="ghost" onPress={() => setConfirm('rollback')} /> : null}
        </View>
        {quotaLeft <= 0 ? <Text variant="bodySm" color="danger">Kuota buat ulang habis.{inv.plan === 'free' ? ' Premium memberi 15 kali.' : ''}</Text> : null}
      </Card>

      {inv.plan === 'free' ? (
        <Card variant="sunken" style={{ gap: space[3] }}>
          <Text variant="h3">Naik ke Premium</Text>
          <Text color="textMuted">Foto, galeri, musik, amplop digital, tanpa watermark, aktif 1 tahun, tamu tak terbatas. Sekali bayar untuk undangan ini.</Text>
          <View style={{ flexDirection: 'row' }}><Button label="Lihat paket" onPress={() => go('/upgrade')} /></View>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
        <Button label="Daftar tamu" variant="secondary" iconLeft="users" onPress={() => go('/tamu')} />
        <Button label="RSVP dan ucapan" variant="secondary" iconLeft="message-square" onPress={() => go('/rsvp')} />
        <Button label="Hapus undangan" variant="ghost" iconLeft="trash-2" onPress={() => setConfirm('delete')} />
      </View>

      <Modal
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'delete' ? 'Hapus undangan?' : 'Kembali ke versi sebelumnya?'}
        footer={
          <View style={{ flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' }}>
            <Button label="Batal" variant="secondary" onPress={() => setConfirm(null)} />
            <Button
              label={confirm === 'delete' ? 'Hapus' : 'Kembalikan'}
              variant={confirm === 'delete' ? 'danger' : 'primary'}
              loading={rollback.isPending || remove.isPending}
              onPress={() => (confirm === 'delete'
                ? remove.mutate(inv.id, { onSuccess: () => router.replace('/app/undangan'), onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }) })
                : rollback.mutate(inv.id, { onSuccess: () => { setConfirm(null); toast.show({ message: 'Versi dikembalikan.', variant: 'success' }); }, onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }) }))}
            />
          </View>
        }
      >
        <Text color="textMuted">{confirm === 'delete' ? `Link ${inv.slug} tidak bisa dibuka lagi dan daftar tamu ikut terhapus. Tidak bisa dibatalkan.` : 'Desain saat ini diganti versi sebelumnya. Kuota buat ulang tidak dikembalikan.'}</Text>
      </Modal>
    </Screen>
  );
}

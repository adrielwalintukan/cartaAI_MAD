import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { InvitationCard } from '../../../components/domain';
import { Button, EmptyState, Modal, Screen, Skeleton, SkeletonGroup, Text, useToast } from '../../../components/ui';
import { formatDateId } from '../../../lib/format';
import { useTheme } from '../../../theme';
import type { InvitationSummary } from '../../../types/api';
import { useMe } from '../../me/hooks';
import { useInvitationMutations, useInvitations } from '../hooks';
import { daysLeft, errMsg, planLabel, STATUS } from '../ui';

function List({ limit }: { limit?: number }) {
  const router = useRouter();
  const toast = useToast();
  const { space, bp } = useTheme();
  const q = useInvitations();
  const { remove } = useInvitationMutations();
  const [del, setDel] = useState<InvitationSummary | null>(null);

  if (q.isLoading) {
    return <SkeletonGroup>{[0, 1].map((i) => <Skeleton key={i} height={140} radius="lg" style={{ marginBottom: space[4] }} />)}</SkeletonGroup>;
  }
  if (q.isError) return <EmptyState variant="error" title="Undangan belum bisa dimuat" description={errMsg(q.error)} actionLabel="Coba lagi" onAction={() => q.refetch()} />;
  const items = (q.data?.items ?? []).slice(0, limit);
  if (!items.length) {
    return <EmptyState title="Belum ada undangan" description="Isi data pernikahanmu, lalu AI menyusun undangannya. Selesai dalam beberapa menit." actionLabel="Buat undangan pertama" onAction={() => router.push('/app/undangan/baru')} />;
  }
  const go = (id: string, sub = '') => router.push(`/app/undangan/${id}${sub}` as never);
  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[4] }}>
        {items.map((i) => {
          const left = daysLeft(i.expires_at);
          return (
            <View key={i.id} style={{ flexBasis: bp === 'desktop' ? '48.5%' : '100%', flexGrow: 1 }}>
              <InvitationCard
                title={i.title}
                subtitle={[i.event_date ? formatDateId(i.event_date, true) : null, i.slug].filter(Boolean).join(' · ')}
                thumbnailUrl={i.cover_url}
                status={STATUS[i.status]}
                plan={planLabel(i.plan)}
                expiryLabel={left == null ? undefined : left > 0 ? `Aktif ${left} hari lagi` : 'Sudah kedaluwarsa'}
                expirySoon={left != null && left <= 7}
                onOpen={() => go(i.id)}
                primary={i.status === 'published' ? { label: 'Bagikan', onPress: () => go(i.id) } : { label: 'Lanjutkan', onPress: () => go(i.id) }}
                secondary={{ label: 'Tamu', onPress: () => go(i.id, '/tamu') }}
                menu={[
                  { label: 'Ubah data', onPress: () => go(i.id, '/edit') },
                  { label: 'Hasil RSVP', onPress: () => go(i.id, '/rsvp') },
                  { label: 'Hapus', danger: true, onPress: () => setDel(i) },
                ]}
              />
            </View>
          );
        })}
      </View>
      <Modal
        visible={!!del}
        onClose={() => setDel(null)}
        title="Hapus undangan?"
        footer={
          <View style={{ flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' }}>
            <Button label="Batal" variant="secondary" onPress={() => setDel(null)} />
            <Button
              label="Hapus"
              variant="danger"
              loading={remove.isPending}
              onPress={() => del && remove.mutate(del.id, {
                onSuccess: () => { setDel(null); toast.show({ message: 'Undangan dihapus.', variant: 'success' }); },
                onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }),
              })}
            />
          </View>
        }
      >
        <Text color="textMuted">Link {del?.slug} tidak bisa dibuka lagi dan daftar tamunya ikut terhapus. Tindakan ini tidak bisa dibatalkan.</Text>
      </Modal>
    </>
  );
}

/** Beranda: sapaan, ajakan membuat, dan tiga undangan terbaru. */
export function HomeScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const me = useMe();
  const name = me.data?.full_name?.split(' ')[0] ?? me.data?.email?.split('@')[0];
  return (
    <Screen style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="h1">{name ? `Halo, ${name}` : 'Beranda'}</Text>
        <Text color="textMuted">Siapkan undangan, kirim ke tamu, lalu pantau siapa yang hadir.</Text>
      </View>
      <View style={{ flexDirection: 'row' }}><Button label="Buat undangan" iconLeft="plus" size="lg" onPress={() => router.push('/app/undangan/baru')} /></View>
      <Text variant="h3">Undangan terbaru</Text>
      <List limit={3} />
    </Screen>
  );
}

export function InvitationListScreen() {
  const router = useRouter();
  const { space } = useTheme();
  return (
    <Screen style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[4], flexWrap: 'wrap' }}>
        <Text variant="h1">Undangan saya</Text>
        <Button label="Buat baru" iconLeft="plus" onPress={() => router.push('/app/undangan/baru')} />
      </View>
      <List />
    </Screen>
  );
}

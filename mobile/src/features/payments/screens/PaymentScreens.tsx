import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { PricingCard } from '../../../components/domain';
import { Button, Card, EmptyState, Screen, Skeleton, Text, useToast } from '../../../components/ui';
import { FREE_FEATURES, PREMIUM_FEATURES, PREMIUM_PRICE } from '../../../lib/plans';
import { useTheme } from '../../../theme';
import { useInvitation } from '../../invitations/hooks';
import { errMsg, openUrl } from '../../invitations/ui';
import { useCreateOrder, useOrder } from '../hooks';

export function UpgradeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const inv = useInvitation(id);
  const order = useCreateOrder();

  const pay = () => order.mutate(id!, {
    onSuccess: (o) => {
      // Web: kembali otomatis ke /app/pembayaran/{order_id} lewat callback Midtrans. Native: buka browser lalu tunggu di layar status.
      if (Platform.OS === 'web') window.location.assign(o.redirect_url);
      else { openUrl(o.redirect_url); router.push(`/app/pembayaran/${o.order_id}` as never); }
    },
    onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }),
  });

  if (inv.isLoading) return <Screen width="prose" style={{ paddingVertical: space[8] }}><Skeleton height={200} radius="lg" /></Screen>;
  if (inv.data?.plan === 'premium') {
    return <Screen width="prose"><EmptyState title="Undangan ini sudah Premium" actionLabel="Kembali ke undangan" onAction={() => router.replace(`/app/undangan/${id}` as never)} /></Screen>;
  }
  return (
    <Screen width="prose" style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="h1">Upgrade ke Premium</Text>
        <Text color="textMuted">Sekali bayar untuk undangan {inv.data?.title ?? 'ini'}. Tidak ada langganan.</Text>
      </View>
      <PricingCard name="Premium" price={PREMIUM_PRICE} priceNote="sekali bayar per undangan" description="Untuk undangan yang ingin tampil utuh." features={PREMIUM_FEATURES} ctaLabel="Bayar sekarang" onPress={pay} highlighted />
      <Card variant="sunken"><Text variant="bodySm" color="textMuted">Pembayaran lewat Midtrans (transfer virtual account, e-wallet, atau kartu). Premium aktif otomatis setelah pembayaran terkonfirmasi, biasanya dalam hitungan detik.</Text></Card>
      <View style={{ flexDirection: 'row' }}><Button label="Bayar sekarang" size="lg" loading={order.isPending} onPress={pay} /></View>
    </Screen>
  );
}

const COPY = {
  pending: { title: 'Menunggu pembayaran', body: 'Selesaikan pembayaran di jendela Midtrans. Halaman ini memeriksa status otomatis.' },
  paid: { title: 'Pembayaran berhasil', body: 'Undanganmu sudah Premium. Foto, galeri, musik, dan amplop digital sekarang bisa dipakai.' },
  failed: { title: 'Pembayaran gagal', body: 'Pembayaran tidak berhasil. Kamu belum ditagih. Coba lagi bila perlu.' },
  expired: { title: 'Pembayaran kedaluwarsa', body: 'Batas waktu pembayaran sudah lewat. Buat pesanan baru untuk melanjutkan.' },
  refunded: { title: 'Pembayaran dikembalikan', body: 'Dana dikembalikan ke metode pembayaranmu.' },
} as const;

export function PaymentStatusScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { space } = useTheme();
  const q = useOrder(orderId);
  if (q.isError) return <Screen><EmptyState variant="error" title="Status belum bisa dimuat" description={errMsg(q.error)} actionLabel="Coba lagi" onAction={() => q.refetch()} /></Screen>;
  const o = q.data;
  const c = o ? COPY[o.status] : null;
  const retry = o && (o.status === 'failed' || o.status === 'expired');
  return (
    <Screen width="prose" style={{ paddingVertical: space[12], gap: space[6] }}>
      {!c ? <Skeleton height={120} radius="lg" /> : (
        <>
          <View style={{ gap: space[2] }}><Text variant="h1">{c.title}</Text><Text color="textMuted">{c.body}</Text></View>
          <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
            {o && o.status === 'paid' ? <Button label="Lihat undangan" onPress={() => router.replace(`/app/undangan/${o.invitation_id}` as never)} /> : null}
            {o && retry ? <Button label="Coba bayar lagi" onPress={() => router.replace(`/app/undangan/${o.invitation_id}/upgrade` as never)} /> : null}
            {o && o.status === 'pending' ? <Button label="Periksa status" variant="secondary" loading={q.isFetching} onPress={() => q.refetch()} /> : null}
            <Button label="Ke beranda" variant="ghost" onPress={() => router.replace('/app')} />
          </View>
        </>
      )}
    </Screen>
  );
}

export { FREE_FEATURES };

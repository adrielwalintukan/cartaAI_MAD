import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, View } from 'react-native';
import { Button, Card, EmptyState, Icon, Screen, Skeleton, Text, useToast } from '../../../components/ui';
import { formatRupiah } from '../../../lib/format';
import { FREE_FEATURES, PREMIUM_FEATURES, PREMIUM_PRICE } from '../../../lib/plans';
import { useTheme } from '../../../theme';
import { useInvitation } from '../../invitations/hooks';
import { errMsg, openUrl } from '../../invitations/ui';
import { useCreateOrder, useOrder } from '../hooks';

export function UpgradeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { space, colors, radius, bp } = useTheme();
  const inv = useInvitation(id);
  const order = useCreateOrder();
  const wide = bp !== 'mobile';
  // Kunci sejak klik pertama sampai halaman Midtrans terbuka; hanya dilepas bila gagal (cegah pesanan ganda).
  const latch = useRef(false);

  const pay = () => {
    if (latch.current) return;
    latch.current = true;
    order.mutate(id!, {
      onSuccess: (o) => {
        // Web: kembali otomatis ke /app/pembayaran/{order_id} lewat callback Midtrans. Native: buka browser lalu tunggu di layar status.
        if (Platform.OS === 'web') window.location.assign(o.redirect_url);
        else { openUrl(o.redirect_url); router.push(`/app/pembayaran/${o.order_id}` as never); }
      },
      onError: (e) => { latch.current = false; toast.show({ message: errMsg(e), variant: 'error' }); },
    });
  };

  if (inv.isLoading) return <Screen style={{ paddingVertical: space[8] }}><Skeleton height={320} radius="lg" /></Screen>;
  if (inv.data?.plan === 'premium') {
    return <Screen width="prose"><EmptyState title="Undangan ini sudah Premium" actionLabel="Kembali ke undangan" onAction={() => router.replace(`/app/undangan/${id}` as never)} /></Screen>;
  }
  const title = inv.data?.title ?? 'undangan ini';
  const price = formatRupiah(PREMIUM_PRICE);
  const payButton = <Button label={`Bayar ${price}`} size="lg" fullWidth loading={order.isPending || order.isSuccess} disabled={order.isPending || order.isSuccess} onPress={pay} />;

  const summary = (
    <View style={{ gap: space[4], padding: space[6], borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      <Text variant="overline" color="textMuted">Ringkasan</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Premium</Text>
          <Text variant="bodySm" color="textMuted" numberOfLines={1}>{title}</Text>
        </View>
        <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{price}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text color="textMuted">Total</Text>
        <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 36 }}>{price}</Text>
      </View>
      {wide ? payButton : null}
      <Text variant="caption" color="textMuted">Pembayaran lewat Midtrans: virtual account, e-wallet, atau kartu. Premium aktif otomatis setelah pembayaran terkonfirmasi, biasanya dalam hitungan detik.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Screen style={{ paddingVertical: space[10] }}>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: space[10], alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: space[6], width: '100%' }}>
            <Text variant="overline" color="accent">Upgrade ke Premium</Text>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: wide ? 52 : 36, lineHeight: wide ? 56 : 40, letterSpacing: -1, color: colors.text }}>
              Buat{' '}
              <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: wide ? 52 : 36, lineHeight: wide ? 56 : 40, color: colors.accent }}>{title}</Text>
              {' '}tampil utuh.
            </Text>
            <Text color="textMuted">Sekali bayar untuk undangan ini. Tanpa langganan, tanpa biaya tersembunyi.</Text>
            <View style={{ borderTopWidth: 1, borderColor: colors.border }}>
              {PREMIUM_FEATURES.filter((f) => f.included).map((f) => (
                <View key={f.text} style={{ flexDirection: 'row', gap: space[3], alignItems: 'center', paddingVertical: space[4], borderBottomWidth: 1, borderColor: colors.border }}>
                  <Icon name="check" color="accent" />
                  <Text style={{ flex: 1 }}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Web: kotak ringkasan menempel saat halaman digulir. */}
          <View style={[{ width: wide ? 380 : '100%' }, wide && Platform.OS === 'web' ? ({ position: 'sticky', top: space[8] } as object) : null]}>
            {summary}
          </View>
        </View>
      </Screen>
      {wide ? null : (
        <View style={{ padding: space[4], borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.bg }}>{payButton}</View>
      )}
    </View>
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

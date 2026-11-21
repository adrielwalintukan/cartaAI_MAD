import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '../../components/ui';
import { formatRupiah } from '../../lib/format';
import { PREMIUM_PRICE } from '../../lib/plans';
import { useTheme } from '../../theme';

// Blok ini selalu gelap di kedua tema (seperti bagian gelap landing), jadi warnanya tetap, bukan token tema.
const INK = '#f4ede1', MUTED = 'rgba(244,237,225,.68)', ACCENT = '#e8a184';
const EASE = Easing.out(Easing.exp);
const PERKS = ['Foto sampul & galeri', 'Musik & amplop digital', 'Tanpa watermark · aktif 1 tahun'];

/** Ajakan upgrade yang jelas di beranda; mockup bergeser halus saat kursor di atas blok (desktop). */
export function PremiumPromo({ onUpgrade }: { onUpgrade: () => void }) {
  const { space, radius, bp } = useTheme();
  const wide = bp !== 'mobile';
  const hover = useSharedValue(0);
  const back = useAnimatedStyle(() => ({ transform: [{ translateX: -hover.value * 10 }, { rotate: `${-7 - hover.value * 2}deg` }] }));
  const front = useAnimatedStyle(() => ({ transform: [{ translateY: -hover.value * 10 }, { rotate: `${5 + hover.value * 2}deg` }] }));
  const set = (v: number) => () => { hover.value = withTiming(v, { duration: 600, easing: EASE }); };

  return (
    <View onPointerEnter={set(1)} onPointerLeave={set(0)} style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
      <LinearGradient colors={['#1f2b24', '#3a2a20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ padding: wide ? space[10] : space[6], flexDirection: 'row', gap: space[8], minHeight: wide ? 320 : undefined }}>
        <View style={{ flex: 1, gap: space[4], justifyContent: 'center' }}>
          <Text variant="overline" style={{ color: ACCENT }}>Premium</Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: wide ? 44 : 32, lineHeight: wide ? 48 : 36, color: INK, letterSpacing: -0.8 }}>
            Undanganmu bisa{' '}
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: wide ? 44 : 32, lineHeight: wide ? 48 : 36, color: ACCENT }}>tampil utuh</Text>.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[3], flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 36, lineHeight: 40, color: INK }}>{formatRupiah(PREMIUM_PRICE)}</Text>
            <Text variant="bodySm" style={{ color: MUTED }}>sekali bayar per undangan, tanpa langganan</Text>
          </View>
          <Text variant="bodySm" style={{ color: MUTED }}>{PERKS.join('  ·  ')}</Text>
          <View style={{ flexDirection: 'row', marginTop: space[2] }}>
            <Pressable accessibilityRole="button" onPress={onUpgrade}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                height: 52, paddingHorizontal: space[6], borderRadius: radius.full, backgroundColor: hovered ? '#fff7ee' : INK,
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: space[2], transform: [{ scale: pressed ? 0.97 : 1 }],
              })}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#1f2b24', fontSize: 16 }}>Upgrade sekarang</Text>
              <Text style={{ color: '#1f2b24', fontSize: 16 }}>→</Text>
            </Pressable>
          </View>
        </View>
        {wide ? (
          <View aria-hidden style={{ width: 260, height: 260, alignSelf: 'center' }}>
            <Animated.View style={[{ position: 'absolute', left: 10, top: 0 }, back]}>
              <Image source={require('../../../assets/templates/phone-formal.webp')} style={{ width: 130, height: 270 }} contentFit="contain" />
            </Animated.View>
            <Animated.View style={[{ position: 'absolute', right: 10, top: 10 }, front]}>
              <Image source={require('../../../assets/templates/phone-elegan.webp')} style={{ width: 130, height: 270 }} contentFit="contain" />
            </Animated.View>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

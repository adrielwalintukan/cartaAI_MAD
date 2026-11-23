import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Icon, Text } from '../../components/ui';
import { FREE_FEATURES, PREMIUM_FEATURES } from '../../lib/plans';
import { useTheme } from '../../theme';

const Row = ({ text, on }: { text: string; on: boolean }) => (
  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 }}>
    <Icon name={on ? 'check' : 'minus'} size={16} color={on ? 'accent' : 'textSubtle'} />
    <Text variant="bodySm" color={on ? 'text' : 'textMuted'} style={{ flex: 1 }}>{text}</Text>
  </View>
);

/** Perbandingan Gratis vs Premium yang bisa dibuka-tutup (dibuka juga dari tombol "Lihat paket"). */
export function PlanCompare({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { space, colors, bp } = useTheme();
  return (
    <View nativeID="bandingkan-paket" style={{ gap: space[4] }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], alignSelf: 'flex-start', minHeight: 44 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Bandingkan Gratis dan Premium</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="textMuted" />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeInDown.duration(500).easing(Easing.out(Easing.exp))} exiting={FadeOut.duration(150)}
          style={{ flexDirection: bp === 'mobile' ? 'column' : 'row', borderTopWidth: 1, borderColor: colors.border }}>
          {[{ name: 'Gratis', note: 'Rp0', rows: FREE_FEATURES }, { name: 'Premium', note: 'Rp99.000 per undangan', rows: PREMIUM_FEATURES }].map((p, i) => (
            <View key={p.name} style={{ flex: 1, paddingVertical: space[5], paddingLeft: i && bp !== 'mobile' ? space[6] : 0,
              borderLeftWidth: i && bp !== 'mobile' ? 1 : 0, borderTopWidth: i && bp === 'mobile' ? 1 : 0, borderColor: colors.border, gap: space[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[3] }}>
                <Text variant="h3" color={i ? 'accent' : 'text'}>{p.name}</Text>
                <Text variant="bodySm" color="textMuted">{p.note}</Text>
              </View>
              {p.rows.map((r) => <Row key={r.text} text={r.text} on={r.included} />)}
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { Badge, Button, Card, Icon, Modal, Text, type BadgeTone } from '../ui';

export type MenuAction = { label: string; onPress: () => void; danger?: boolean };

type Props = {
  title: string;
  /** Mis. "12 Des 2026 · adriel-tiara". */
  subtitle: string;
  thumbnailUrl?: string | null;
  status: { label: string; tone: BadgeTone };
  plan: 'Gratis' | 'Premium';
  expiryLabel?: string;
  expirySoon?: boolean;
  onOpen: () => void;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  menu?: MenuAction[];
  /** Kartu Gratis: tombol Upgrade berwarna aksen. */
  onUpgrade?: () => void;
  /** Mis. "3 dari 10 tamu sudah RSVP". */
  rsvpLine?: string;
  /** Sisa masa aktif 0–1 untuk bar tipis. */
  expiryProgress?: number;
};

/** Kartu riwayat: seluruh kartu dapat dibuka; tidak lebih dari dua aksi terlihat. */
export function InvitationCard({ title, subtitle, thumbnailUrl, status, plan, expiryLabel, expirySoon, onOpen, primary, secondary, menu, onUpgrade, rsvpLine, expiryProgress }: Props) {
  const { colors, radius, space, bp } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const thumb = bp === 'mobile' ? 84 : 108;
  // Terangkat halus + garis tepi aksen saat kursor di atas (web) / disentuh.
  const lift = useSharedValue(0);
  const [hovered, setHovered] = useState(false);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * 3 }] }));
  const hover = (on: boolean) => () => { setHovered(on); lift.value = withTiming(on ? 1 : 0, { duration: 250, easing: Easing.out(Easing.exp) }); };
  return (
    <Animated.View style={liftStyle} onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
    <Card style={{ gap: space[4], borderColor: hovered ? colors.accent : colors.border }}>
      {/* Area buka dipisah dari area aksi: tombol tidak boleh bersarang di dalam tombol (docs/03 §5.3). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${status.label}, paket ${plan}. ${subtitle}`}
        onPress={onOpen}
        style={{ flexDirection: 'row', gap: space[4] }}
      >
        <View style={{ width: thumb, height: thumb * 1.33, borderRadius: radius.md, backgroundColor: thumbnailUrl ? colors.surfaceSunken : colors.accentSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {thumbnailUrl
            ? <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={`Pratinjau ${title}`} />
            : (
              <View style={{ position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1, borderColor: colors.accent, opacity: 0.45, borderRadius: radius.sm }} />
            )}
          {thumbnailUrl ? null : <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: thumb * 0.45, lineHeight: thumb * 0.55 }} color="onAccentSoft">{title.trim().charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={{ flex: 1, gap: space[1] }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 26 }} numberOfLines={2}>{title}</Text>
          <Text variant="bodySm" color="textMuted" numberOfLines={1}>{subtitle}</Text>
          <View style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap', marginTop: space[1] }}>
            <Badge label={status.label} tone={status.tone} />
            <Badge label={plan} tone={plan === 'Premium' ? 'accent' : 'neutral'} />
          </View>
          {rsvpLine ? <Text variant="bodySm" color="textMuted">{rsvpLine}</Text> : null}
          {expiryLabel ? (
            <View style={{ gap: 6, marginTop: space[1], maxWidth: 260 }}>
              {expiryProgress != null ? (
                <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
                  <View style={{ height: 3, width: `${Math.max(4, Math.min(100, expiryProgress * 100))}%`, backgroundColor: expirySoon ? colors.warning : colors.accent }} />
                </View>
              ) : null}
              <Text variant="caption" color={expirySoon ? 'warning' : 'textMuted'}>{expiryLabel}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Button label={primary.label} size="sm" onPress={primary.onPress} />
        {secondary ? <Button label={secondary.label} size="sm" variant="secondary" onPress={secondary.onPress} /> : null}
        {onUpgrade ? <Button label="Upgrade" iconLeft="zap" size="sm" variant="ghost" onPress={onUpgrade} accessibilityLabel={`Upgrade ${title} ke Premium`} /> : null}
        <View style={{ flex: 1 }} />
        {menu?.length ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Menu untuk ${title}`} onPress={() => setMenuOpen(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more-horizontal" color="textMuted" />
          </Pressable>
        ) : null}
      </View>
      {menu?.length ? (
        <Modal visible={menuOpen} onClose={() => setMenuOpen(false)} title={title}>
          {menu.map((m) => (
            <Pressable key={m.label} accessibilityRole="button" onPress={() => { setMenuOpen(false); m.onPress(); }} style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text color={m.danger ? 'danger' : 'text'}>{m.label}</Text>
            </Pressable>
          ))}
        </Modal>
      ) : null}
    </Card>
    </Animated.View>
  );
}

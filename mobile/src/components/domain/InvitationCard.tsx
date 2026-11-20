import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
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
};

/** Kartu riwayat: seluruh kartu dapat dibuka; tidak lebih dari dua aksi terlihat. */
export function InvitationCard({ title, subtitle, thumbnailUrl, status, plan, expiryLabel, expirySoon, onOpen, primary, secondary, menu }: Props) {
  const { colors, radius, space, bp } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const thumb = bp === 'mobile' ? 72 : 96;
  return (
    <Card style={{ gap: space[4] }}>
      {/* Area buka dipisah dari area aksi: tombol tidak boleh bersarang di dalam tombol (docs/03 §5.3). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${status.label}, paket ${plan}. ${subtitle}`}
        onPress={onOpen}
        style={{ flexDirection: 'row', gap: space[4] }}
      >
        <View style={{ width: thumb, height: thumb * 1.25, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {thumbnailUrl
            ? <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={`Pratinjau ${title}`} />
            : <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 28 }} color="textMuted">{title.trim().charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={{ flex: 1, gap: space[1] }}>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 26 }} numberOfLines={2}>{title}</Text>
          <Text variant="bodySm" color="textMuted" numberOfLines={1}>{subtitle}</Text>
          <View style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap', marginTop: space[1] }}>
            <Badge label={status.label} tone={status.tone} />
            <Badge label={plan} tone={plan === 'Premium' ? 'accent' : 'neutral'} />
          </View>
          {expiryLabel ? <Text variant="caption" color={expirySoon ? 'warning' : 'textMuted'}>{expiryLabel}</Text> : null}
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Button label={primary.label} size="sm" onPress={primary.onPress} />
        {secondary ? <Button label={secondary.label} size="sm" variant="secondary" onPress={secondary.onPress} /> : null}
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
  );
}

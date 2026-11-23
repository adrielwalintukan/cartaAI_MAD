import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme';
import { Badge, Button, Icon, Modal, Text, type BadgeTone } from '../ui';
import type { MenuAction } from './InvitationCard';

export type Rsvp = 'belum' | 'hadir' | 'tidak_hadir' | 'ragu';
const RSVP: Record<Rsvp, { label: string; tone: BadgeTone }> = {
  belum: { label: 'Belum dibuka', tone: 'neutral' },
  hadir: { label: 'Hadir', tone: 'success' },
  tidak_hadir: { label: 'Tidak hadir', tone: 'danger' },
  ragu: { label: 'Ragu', tone: 'warning' },
};

type Props = {
  name: string;
  /** Kontak atau grup. */
  detail?: string;
  rsvp: Rsvp;
  onSendWhatsApp?: () => void;
  menu?: MenuAction[];
};

export function GuestRow({ name, detail, rsvp, onSendWhatsApp, menu }: Props) {
  const { colors, radius, space, bp } = useTheme();
  const [open, setOpen] = useState(false);
  const desktop = bp === 'desktop';
  const r = RSVP[rsvp];
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  return (
    <View
      role="group"
      accessibilityLabel={`${name}, ${r.label}`}
      style={{ minHeight: desktop ? 56 : 64, flexDirection: 'row', alignItems: 'center', gap: space[3], borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: space[2] }}
    >
      <View style={{ width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="label" color="textMuted">{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_500Medium' }} numberOfLines={1}>{name}</Text>
        {detail ? <Text variant="bodySm" color="textMuted" numberOfLines={1}>{detail}</Text> : null}
      </View>
      <Badge label={r.label} tone={r.tone} />
      {onSendWhatsApp ? (
        desktop
          ? <Button label="Kirim WhatsApp" variant="secondary" size="sm" iconLeft="send" onPress={onSendWhatsApp} accessibilityLabel={`Kirim WhatsApp ke ${name}`} />
          : (
            <Pressable accessibilityRole="button" accessibilityLabel={`Kirim WhatsApp ke ${name}`} onPress={onSendWhatsApp} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" color="accent" />
            </Pressable>
          )
      ) : null}
      {menu?.length ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={`Menu untuk ${name}`} onPress={() => setOpen(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more-horizontal" color="textMuted" />
          </Pressable>
          <Modal visible={open} onClose={() => setOpen(false)} title={name}>
            {menu.map((m) => (
              <Pressable key={m.label} accessibilityRole="button" onPress={() => { setOpen(false); m.onPress(); }} style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text color={m.danger ? 'danger' : 'text'}>{m.label}</Text>
              </Pressable>
            ))}
          </Modal>
        </>
      ) : null}
    </View>
  );
}

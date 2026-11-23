import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Modal, Text, useToast } from '../../components/ui';
import { formatDateId } from '../../lib/format';
import { useTheme } from '../../theme';
import { upgradeTargets } from '../dashboard/summary';
import { useInvitations } from '../invitations/hooks';
import { errMsg } from '../invitations/ui';

/** Upgrade dari mana saja: 0 undangan → buat dulu; 1 target → langsung checkout; >1 → pilih undangan. */
export function useStartUpgrade() {
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const q = useInvitations();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const items = q.data?.items ?? [];
  const targets = upgradeTargets(items);
  const go = (id: string) => router.push(`/app/undangan/${id}/upgrade` as never);

  const busy = useRef(false);
  const start = async () => {
    if (busy.current) return;
    busy.current = true;
    // Diklik sebelum daftar termuat: tunggu datanya, jangan menyimpulkan "belum ada undangan".
    const r = q.data ?? (await q.refetch()).data;
    busy.current = false;
    if (!r) { toast.show({ message: errMsg(q.error), variant: 'error' }); return; }
    const all = r.items;
    const targets = upgradeTargets(all);
    if (!all.length) {
      toast.show({ message: 'Buat undangan dulu, lalu upgrade dari sana.', variant: 'info' });
      router.push('/app/undangan/baru');
    } else if (!targets.length) toast.show({ message: 'Semua undanganmu sudah Premium.', variant: 'info' });
    else if (targets.length === 1) go(targets[0].id);
    else { setPicked(null); setOpen(true); }
  };

  const sheet = (
    <Modal
      visible={open}
      onClose={() => setOpen(false)}
      title="Pilih undangan yang mau di-upgrade"
      footer={
        <View style={{ flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' }}>
          <Button label="Batal" variant="secondary" onPress={() => setOpen(false)} />
          <Button label="Lanjut" disabled={!picked} onPress={() => { setOpen(false); if (picked) go(picked); }} />
        </View>
      }
    >
      <View style={{ gap: space[3] }} role="radiogroup">
        {targets.map((i) => (
          <Card key={i.id} variant="interactive" radio selected={picked === i.id} onPress={() => setPicked(i.id)}
            accessibilityLabel={`${i.title}${i.event_date ? `, ${formatDateId(i.event_date, true)}` : ''}`}
            style={{ flexDirection: 'row', gap: space[3], alignItems: 'center' }}>
            <View style={{ width: 40, height: 52, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24 }} color="accent">{i.title.trim().charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h3" numberOfLines={1}>{i.title}</Text>
              <Text variant="bodySm" color="textMuted">{i.event_date ? formatDateId(i.event_date, true) : 'Draf'} · {i.slug}</Text>
            </View>
          </Card>
        ))}
      </View>
    </Modal>
  );

  return { start, sheet, hasTargets: targets.length > 0, hasInvitations: items.length > 0 };
}

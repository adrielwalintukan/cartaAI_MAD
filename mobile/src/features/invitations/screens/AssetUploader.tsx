import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, useToast } from '../../../components/ui';
import { useTheme } from '../../../theme';
import type { AssetKind, Invitation } from '../../../types/api';
import { generatorApi, uploadAsset } from '../../generator/api';
import { invitationKeys } from '../hooks';
import { errMsg } from '../ui';

type Picked = { uri: string; mime?: string };

async function pick(kind: AssetKind, multi: boolean): Promise<Picked[]> {
  if (kind === 'music') {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    return r.canceled ? [] : r.assets.map((a) => ({ uri: a.uri, mime: a.mimeType }));
  }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: multi, quality: 0.85 });
  return r.canceled ? [] : r.assets.map((a) => ({ uri: a.uri, mime: a.mimeType }));
}

/** Unggah langsung ke Storage lewat URL bertanda tangan; server memvalidasi tipe dan ukuran (06 §5). */
export function AssetUploader({ inv, kind, label, multi = false, max = 1 }: { inv: Invitation; kind: AssetKind; label: string; multi?: boolean; max?: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { space, radius, colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const items = inv.assets.filter((a) => a.kind === kind);
  const refresh = () => qc.invalidateQueries({ queryKey: invitationKeys.detail(inv.id) });

  const add = async () => {
    setBusy(true);
    try {
      const picked = (await pick(kind, multi)).slice(0, max - items.length);
      for (const [i, p] of picked.entries()) {
        const blob = await (await fetch(p.uri)).blob();
        await uploadAsset(inv.id, { kind, contentType: blob.type || p.mime || 'application/octet-stream', sizeBytes: blob.size, position: items.length + i, body: blob });
      }
      if (picked.length) await refresh();
    } catch (e) {
      toast.show({ message: errMsg(e), variant: 'error' });
    } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    try { await generatorApi.removeAsset(inv.id, id); await refresh(); } catch (e) { toast.show({ message: errMsg(e), variant: 'error' }); }
  };

  return (
    <View style={{ gap: space[2] }}>
      <Text variant="label">{label}{multi ? ` (${items.length}/${max})` : ''}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3], alignItems: 'center' }}>
        {items.map((a) => (
          <View key={a.id} style={{ gap: space[1], alignItems: 'center' }}>
            {kind === 'music'
              ? <View style={{ padding: space[3], borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}><Text variant="bodySm">Musik terunggah</Text></View>
              : <Image source={{ uri: a.url }} style={{ width: 72, height: 90, borderRadius: radius.md }} contentFit="cover" accessibilityLabel={label} />}
            <Button label="Hapus" size="sm" variant="ghost" onPress={() => remove(a.id)} />
          </View>
        ))}
        {items.length < max ? <Button label={kind === 'music' ? 'Pilih musik' : 'Pilih foto'} variant="secondary" iconLeft="upload" loading={busy} onPress={add} /> : null}
      </View>
    </View>
  );
}

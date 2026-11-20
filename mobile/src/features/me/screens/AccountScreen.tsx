import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Screen, Segmented, Skeleton, Text, TextField, useToast } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { errMsg } from '../../invitations/ui';
import { useMe, useUpdateMe } from '../hooks';

export function AccountScreen() {
  const { space, scheme, setScheme } = useTheme();
  const { signOut } = useAuth();
  const toast = useToast();
  const me = useMe();
  const update = useUpdateMe();
  const [name, setName] = useState('');
  useEffect(() => { if (me.data) setName(me.data.full_name ?? ''); }, [me.data]);

  return (
    <Screen width="form" style={{ paddingVertical: space[8], gap: space[6] }}>
      <Text variant="h1">Akun</Text>
      {me.isLoading ? <Skeleton height={140} radius="lg" /> : (
        <Card style={{ gap: space[4] }}>
          <Text variant="bodySm" color="textMuted">{me.data?.email} · {me.data?.invitations_count ?? 0} undangan</Text>
          <TextField label="Nama" value={name} onChangeText={setName} autoComplete="name" />
          <View style={{ flexDirection: 'row' }}>
            <Button label="Simpan" loading={update.isPending} disabled={name.trim() === (me.data?.full_name ?? '')} onPress={() => update.mutate({ full_name: name.trim() }, { onSuccess: () => toast.show({ message: 'Nama disimpan.', variant: 'success' }), onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }) })} />
          </View>
        </Card>
      )}
      <Card style={{ gap: space[3] }}>
        <Text variant="h3">Tampilan</Text>
        <Segmented label="Tema" value={scheme} onChange={setScheme} options={[{ value: 'system', label: 'Sistem' }, { value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }]} />
      </Card>
      <View style={{ flexDirection: 'row' }}><Button label="Keluar" variant="secondary" iconLeft="log-out" onPress={signOut} /></View>
    </Screen>
  );
}

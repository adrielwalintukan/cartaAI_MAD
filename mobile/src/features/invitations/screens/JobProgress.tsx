import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button, Card, EmptyState, ProgressSteps, Screen, Text, useToast } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useJob, useStartGenerate } from '../../generator/hooks';
import { useInvitation } from '../hooks';
import { errMsg, JOB_STEPS, openUrl, shareLink } from '../ui';

export function JobProgressScreen() {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId: string }>();
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const job = useJob(jobId);
  const inv = useInvitation(id);
  const retry = useStartGenerate();

  if (job.isError) return <Screen><EmptyState variant="error" title="Status belum bisa dimuat" description={errMsg(job.error)} actionLabel="Coba lagi" onAction={() => job.refetch()} /></Screen>;

  const j = job.data;
  const stageIdx = Math.max(0, JOB_STEPS.findIndex((s) => s.key === j?.stage));
  const done = j?.status === 'succeeded';
  const failed = j?.status === 'failed';
  const steps = JOB_STEPS.map((s, i) => ({
    key: s.key,
    label: s.label,
    status: (done || i < stageIdx ? 'done' : i === stageIdx ? (failed ? 'failed' : j?.status === 'running' ? 'running' : 'waiting') : 'waiting') as 'done' | 'running' | 'waiting' | 'failed',
  }));
  const url = inv.data?.public_url;

  return (
    <Screen width="prose" style={{ paddingVertical: space[8], gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text variant="h1">{done ? 'Undanganmu siap' : failed ? 'Undangan belum jadi' : 'AI sedang menyusun undanganmu'}</Text>
        <Text color="textMuted">{done ? 'Link sudah aktif dan bisa dibagikan.' : failed ? (j?.error?.message ?? 'Terjadi kesalahan saat membuat undangan.') : 'Biasanya selesai dalam satu menit. Halaman ini boleh ditutup, hasilnya tetap tersimpan.'}</Text>
      </View>

      <Card><ProgressSteps variant="job" steps={steps} hint={failed ? undefined : 'Tahap berjalan sesuai laporan server.'} /></Card>

      {done && url ? (
        <Card style={{ gap: space[4] }}>
          <Text selectable color="accent" style={{ fontFamily: 'Inter_500Medium' }}>{url}</Text>
          <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
            <Button label="Salin link" iconLeft="copy" onPress={async () => { try { await shareLink(url); toast.show({ message: 'Link siap dibagikan.', variant: 'success' }); } catch { toast.show({ message: 'Link belum bisa disalin.', variant: 'error' }); } }} />
            <Button label="Buka undangan" variant="secondary" iconLeft="external-link" onPress={() => openUrl(url)} />
            <Button label="Kirim ke tamu" variant="secondary" onPress={() => router.replace(`/app/undangan/${id}/tamu` as never)} />
          </View>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
        {failed ? (
          <Button
            label="Coba lagi"
            loading={retry.isPending}
            onPress={() => retry.mutate(id!, { onSuccess: (r) => router.replace(`/app/undangan/${id}/proses/${r.job_id}` as never), onError: (e) => toast.show({ message: errMsg(e), variant: 'error' }) })}
          />
        ) : null}
        <Button label="Ke detail undangan" variant="secondary" onPress={() => router.replace(`/app/undangan/${id}` as never)} />
      </View>
    </Screen>
  );
}

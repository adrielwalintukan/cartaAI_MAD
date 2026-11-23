import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type Step = { key: string; label: string };
export type JobStepStatus = 'waiting' | 'running' | 'done' | 'failed';

type StepperProps = { variant: 'stepper'; steps: Step[]; current: number };
type JobProps = { variant: 'job'; steps: (Step & { status: JobStepStatus })[]; hint?: string };

const LABEL: Record<JobStepStatus, string> = { waiting: 'menunggu', running: 'berjalan', done: 'selesai', failed: 'gagal' };

/** `stepper`: form multi-langkah. `job`: status pekerjaan dari server (tanpa persen palsu). */
export function ProgressSteps(props: StepperProps | JobProps) {
  return props.variant === 'stepper' ? <Stepper {...props} /> : <JobList {...props} />;
}

function Stepper({ steps, current }: StepperProps) {
  const { colors, bp, space, radius } = useTheme();
  const total = steps.length;
  const a11y = { role: 'progressbar' as const, 'aria-valuenow': current + 1, 'aria-valuemin': 1, 'aria-valuemax': total, accessibilityLabel: `Langkah ${current + 1} dari ${total}, ${steps[current]?.label}` };
  if (bp === 'mobile') {
    return (
      <View {...a11y} style={{ gap: space[2] }}>
        <Text variant="bodySm" color="textMuted">Langkah {current + 1} dari {total} · {steps[current]?.label}</Text>
        <View style={{ height: 4, borderRadius: radius.full, backgroundColor: colors.border, overflow: 'hidden' }}>
          <View style={{ height: 4, width: `${((current + 1) / total) * 100}%`, backgroundColor: colors.accent }} />
        </View>
      </View>
    );
  }
  return (
    <View {...a11y} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.key}>
            <View style={{ alignItems: 'center', gap: space[2], width: 96 }}>
              <View style={{
                width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? colors.accent : 'transparent', borderWidth: 1.5, borderColor: done || active ? colors.accent : colors.borderStrong,
              }}>
                {done ? <Icon name="check" size={16} color="accent" /> : <Text variant="caption" color={active ? 'onAccent' : 'textMuted'}>{i + 1}</Text>}
              </View>
              <Text variant="bodySm" color={active ? 'text' : 'textMuted'} style={{ textAlign: 'center' }}>{s.label}</Text>
            </View>
            {i < total - 1 ? <View style={{ flex: 1, height: 1.5, marginTop: 13, backgroundColor: done ? colors.accent : colors.border }} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function JobList({ steps, hint }: JobProps) {
  const { colors, space } = useTheme();
  return (
    <View style={{ gap: space[3] }} accessibilityLiveRegion="polite" role="list">
      {steps.map((s) => (
        <View key={s.key} role="listitem" style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }} accessibilityLabel={`${s.label}: ${LABEL[s.status]}`}>
          <View style={{ width: 24, alignItems: 'center' }}>
            {s.status === 'running' ? <ActivityIndicator size="small" color={colors.accent} />
              : s.status === 'done' ? <Icon name="check-circle" size={24} color="success" />
              : s.status === 'failed' ? <Icon name="x-circle" size={24} color="danger" />
              : <Icon name="circle" size={24} color="borderStrong" />}
          </View>
          <Text color={s.status === 'waiting' ? 'textMuted' : s.status === 'failed' ? 'danger' : 'text'}>{s.label}</Text>
        </View>
      ))}
      {hint ? <Text variant="bodySm" color="textMuted" style={{ marginTop: space[2] }}>{hint}</Text> : null}
    </View>
  );
}

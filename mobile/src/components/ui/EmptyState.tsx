import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** `error`: gagal memuat → "Coba lagi". */
  variant?: 'empty' | 'error';
};

export function EmptyState({ title, description, actionLabel, onAction, variant = 'empty' }: Props) {
  const { space } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space[12], paddingHorizontal: space[4], gap: space[2] }} role={variant === 'error' ? 'alert' : undefined}>
      <Text variant="h3" style={{ textAlign: 'center' }}>{title}</Text>
      {description ? <Text color="textMuted" style={{ textAlign: 'center', maxWidth: 420 }}>{description}</Text> : null}
      {actionLabel && onAction ? <View style={{ marginTop: space[4] }}><Button label={actionLabel} onPress={onAction} /></View> : null}
    </View>
  );
}

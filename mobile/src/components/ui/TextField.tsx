import React, { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { useFocusRing } from './useFocusRing';

export type FieldShellProps = {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

/** Label selalu terlihat (bukan placeholder) → kontrol → bantuan/galat. */
export function FieldShell({ label, optional, hint, error, children }: FieldShellProps) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="label">{label}{optional ? <Text inline color="textMuted"> (opsional)</Text> : null}</Text>
      {hint ? <Text variant="bodySm" color="textMuted">{hint}</Text> : null}
      {children}
      {error ? (
        <View style={{ flexDirection: 'row', gap: space[1], alignItems: 'center' }} accessibilityLiveRegion="polite" role="alert">
          <Icon name="alert-circle" size={16} color="danger" />
          <Text variant="bodySm" color="danger" style={{ flex: 1 }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Jumlah baris minimum; >1 menjadikannya area teks yang tumbuh. */
  rows?: number;
};

export function useControlStyle(opts: { error?: string; disabled?: boolean; focused: boolean; hovered?: boolean }) {
  const { colors, radius, border, t } = useTheme();
  return {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: opts.disabled ? colors.surfaceSunken : colors.surface,
    borderWidth: opts.focused || opts.error ? border.strong : border.hairline,
    borderColor: opts.error ? colors.danger : opts.focused ? colors.accent : opts.hovered ? colors.textMuted : colors.borderStrong,
    color: opts.disabled ? colors.textSubtle : colors.text,
    ...t('body'),
  } as const;
}

export function TextField({ label, optional, hint, error, disabled, rows = 1, maxLength, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { colors, space } = useTheme();
  const ring = useFocusRing();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const multi = rows > 1;
  const control = useControlStyle({ error, disabled, focused, hovered });
  return (
    <FieldShell label={label} optional={optional} hint={hint} error={error}>
      <TextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        editable={!disabled}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        maxLength={maxLength}
        multiline={multi}
        {...rest}
        onFocus={(e) => { setFocused(true); ring.handlers.onFocus(e); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); ring.handlers.onBlur(); onBlur?.(e); }}
        {...({ onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } as object)}
        style={[
          control,
          multi ? { minHeight: 24 * rows + 24, paddingVertical: space[3], textAlignVertical: 'top' } : { paddingVertical: 0 },
          ring.style as object | null,
        ]}
      />
      {maxLength && typeof rest.value === 'string' ? (
        <Text variant="caption" color="textSubtle" style={{ textAlign: 'right' }}>{rest.value.length}/{maxLength}</Text>
      ) : null}
    </FieldShell>
  );
}

/** Area teks: TextField dengan minimal 3 baris. */
export function TextArea(props: TextFieldProps) {
  return <TextField rows={3} {...props} />;
}

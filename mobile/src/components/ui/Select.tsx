import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { FieldShell, useControlStyle } from './TextField';
import { Text } from './Text';
import { useFocusRing } from './useFocusRing';

export type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  value: T | null;
  options: Option<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

/** Field + daftar opsi di dialog/sheet (satu pola untuk web dan native, opsi tinggi 48). */
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Pilih', optional, hint, error, disabled }: Props<T>) {
  const { colors, space } = useTheme();
  const ring = useFocusRing();
  const [open, setOpen] = useState(false);
  const control = useControlStyle({ error, disabled, focused: ring.on || open });
  const current = options.find((o) => o.value === value);
  return (
    <FieldShell label={label} optional={optional} hint={hint} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? 'belum dipilih'}`}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        aria-haspopup="listbox"
        disabled={disabled}
        onPress={() => setOpen(true)}
        {...ring.handlers}
        style={[control, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] }, ring.style]}
      >
        <Text color={current ? 'text' : 'textSubtle'} numberOfLines={1} style={{ flex: 1 }}>{current?.label ?? placeholder}</Text>
        <Icon name="chevron-down" color="textMuted" />
      </Pressable>
      <Modal visible={open} onClose={() => setOpen(false)} title={label}>
        <View role="radiogroup" aria-label={label}>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                role="radio"
                accessibilityState={{ selected }}
                aria-checked={selected}
                onPress={() => { onChange(o.value); setOpen(false); }}
                style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <Text color={selected ? 'accent' : 'text'}>{o.label}</Text>
                {selected ? <Icon name="check" color="accent" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </FieldShell>
  );
}

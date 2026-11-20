import DateTimePicker from '@react-native-community/datetimepicker';
import React, { createElement, useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { FieldShell, useControlStyle } from './TextField';
import { Text } from './Text';
import { useFocusRing } from './useFocusRing';

type Props = {
  label: string;
  /** `date`: 'YYYY-MM-DD'. `time`: 'HH:MM' (24 jam). Kosong = belum dipilih. */
  value: string;
  onChange: (v: string) => void;
  mode?: 'date' | 'time';
  optional?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function parse(value: string, mode: 'date' | 'time'): Date {
  const d = new Date();
  if (!value) return d;
  if (mode === 'date') {
    const [y, m, day] = value.split('-').map(Number);
    return new Date(y, (m || 1) - 1, day || 1);
  }
  const [h, mi] = value.split(':').map(Number);
  d.setHours(h || 0, mi || 0, 0, 0);
  return d;
}

/** Tampilan "12 Desember 2026" (id-ID) atau "09.00". */
export function formatPicked(value: string, mode: 'date' | 'time') {
  if (!value) return '';
  const d = parse(value, mode);
  return mode === 'date'
    ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

export function DatePicker({ label, value, onChange, mode = 'date', optional, hint, error, disabled }: Props) {
  const { colors } = useTheme();
  const ring = useFocusRing();
  const [open, setOpen] = useState(false);
  const control = useControlStyle({ error, disabled, focused: ring.on || open });
  const shown = formatPicked(value, mode);

  if (Platform.OS === 'web') {
    // <input type="date|time"> asli: pemilih bawaan browser + ketik manual.
    const input = createElement('input', {
      type: mode,
      value,
      disabled,
      'aria-label': label,
      'aria-invalid': !!error,
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      // CSS DOM asli (bukan gaya RN): lineHeight angka akan dianggap pengali, padding* RN tidak dikenal.
      style: {
        height: control.minHeight, width: '100%', boxSizing: 'border-box', padding: '0 14px', borderRadius: control.borderRadius,
        border: `${control.borderWidth}px solid ${control.borderColor}`, backgroundColor: control.backgroundColor,
        color: control.color, fontFamily: control.fontFamily, fontSize: control.fontSize, colorScheme: 'inherit', outlineColor: colors.focusRing,
      },
    });
    return <FieldShell label={label} optional={optional} hint={hint} error={error}>{input}</FieldShell>;
  }

  const picker = (
    <DateTimePicker
      value={parse(value, mode)}
      mode={mode}
      is24Hour
      locale="id-ID"
      display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
      accentColor={colors.accent}
      onChange={(e, d) => {
        if (Platform.OS === 'android') setOpen(false);
        if (e.type === 'set' && d) onChange(mode === 'date' ? toIso(d) : toHm(d));
      }}
    />
  );

  return (
    <FieldShell label={label} optional={optional} hint={hint} error={error}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown || 'belum dipilih'}`}
        accessibilityHint={mode === 'date' ? 'Membuka pemilih tanggal' : 'Membuka pemilih jam'}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        {...ring.handlers}
        style={[control, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ring.style]}
      >
        <Text color={shown ? 'text' : 'textSubtle'}>{shown || (mode === 'date' ? 'Pilih tanggal' : 'Pilih jam')}</Text>
        <Icon name={mode === 'date' ? 'calendar' : 'clock'} color="textMuted" />
      </Pressable>
      {Platform.OS === 'android' ? (open ? picker : null) : (
        <Modal visible={open} onClose={() => setOpen(false)} title={label} footer={<Button label="Selesai" onPress={() => setOpen(false)} />}>
          {picker}
        </Modal>
      )}
    </FieldShell>
  );
}

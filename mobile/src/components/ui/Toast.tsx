import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { maxWidth, useTheme } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'success' | 'error' | 'info';
type ToastInput = { message: string; variant?: Variant; actionLabel?: string; onAction?: () => void };
type Item = ToastInput & { id: number };

const ICON: Record<Variant, { name: IconName; color: 'success' | 'danger' | 'info' }> = {
  success: { name: 'check-circle', color: 'success' },
  error: { name: 'alert-circle', color: 'danger' },
  info: { name: 'info', color: 'info' },
};

const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}

function ToastView({ item, onDismiss }: { item: Item; onDismiss: () => void }) {
  const { colors, radius, space, elev } = useTheme();
  const variant = item.variant ?? 'info';
  const paused = useRef(false);

  useEffect(() => {
    // sukses 4 dtk, error 8 dtk (docs/03 §5.7); jeda saat hover.
    let left = variant === 'error' ? 8000 : 4000;
    const iv = setInterval(() => {
      if (paused.current) return;
      left -= 250;
      if (left <= 0) onDismiss();
    }, 250);
    return () => clearInterval(iv);
  }, [variant, onDismiss]);

  const i = ICON[variant];
  return (
    <View
      role={variant === 'error' ? 'alert' : 'status'}
      accessibilityLiveRegion={variant === 'error' ? 'assertive' : 'polite'}
      {...({ onMouseEnter: () => { paused.current = true; }, onMouseLeave: () => { paused.current = false; } } as object)}
      style={[{
        width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3],
        backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md,
      }, elev(1)]}
    >
      <Icon name={i.name} color={i.color} />
      <Text variant="bodySm" numberOfLines={2} style={{ flex: 1 }}>{item.message}</Text>
      {item.actionLabel ? (
        <Pressable accessibilityRole="button" onPress={() => { item.onAction?.(); onDismiss(); }} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="label" color="accent">{item.actionLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Tutup pesan" onPress={onDismiss} hitSlop={8} style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="x" size={16} color="textMuted" />
      </Pressable>
    </View>
  );
}

export function ToastProvider({ children, bottomOffset = 16 }: { children: React.ReactNode; bottomOffset?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const insets = useSafeAreaInsets();
  const { bp, space } = useTheme();
  const seq = useRef(0);
  const show = useCallback((t: ToastInput) => setItems((p) => [...p.slice(-2), { ...t, id: ++seq.current }]), []);
  const value = useMemo(() => ({ show }), [show]);
  const desktop = bp === 'desktop';
  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute', left: 0, right: 0, bottom: bottomOffset + insets.bottom, paddingHorizontal: space[4], gap: space[2],
          alignItems: desktop ? 'flex-end' : 'center', maxWidth: maxWidth.page, alignSelf: 'center', width: '100%',
        }}
      >
        {items.map((it) => (
          <ToastView key={it.id} item={it} onDismiss={() => setItems((p) => p.filter((x) => x.id !== it.id))} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

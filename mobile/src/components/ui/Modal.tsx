import React from 'react';
import { Modal as RNModal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Kaki aksi (tombol), sudah disusun pemanggil: batal di kiri, primer di kanan. */
  footer?: React.ReactNode;
  /** false: klik scrim tidak menutup (form belum disimpan). */
  dismissOnScrim?: boolean;
};

/** Dialog di desktop/tablet, sheet bawah di mobile (docs/03 §5.6). */
export function Modal({ visible, onClose, title, children, footer, dismissOnScrim = true }: Props) {
  const { colors, radius, space, bp, elev } = useTheme();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheet = bp === 'mobile';

  const panel = {
    backgroundColor: colors.surfaceRaised,
    padding: space[6],
    ...elev(2),
    ...(sheet
      ? { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: height * 0.9, paddingBottom: space[6] + insets.bottom, width: '100%' as const }
      : { borderRadius: radius.lg, width: '100%' as const, maxWidth: 480 }),
  };

  return (
    <RNModal
      visible={visible}
      transparent
      onRequestClose={onClose}
      animationType={reduce ? 'none' : sheet ? 'slide' : 'fade'}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: sheet ? 'flex-end' : 'center', alignItems: 'center', padding: sheet ? 0 : space[6] }}>
        <Pressable
          accessible={false}
          onPress={dismissOnScrim ? onClose : undefined}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }}
        />
        <View role="dialog" aria-modal accessibilityViewIsModal aria-label={title} style={panel}>
          {sheet ? (
            <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: radius.full, backgroundColor: colors.border, marginBottom: space[4] }} />
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[3], marginBottom: space[4] }}>
            <Text variant="h2" style={{ flex: 1 }}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              onPress={onClose}
              hitSlop={10}
              style={{ width: 44, height: 44, marginTop: -8, marginRight: -12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={24} color="textMuted" />
            </Pressable>
          </View>
          <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          {footer ? (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space[3], marginTop: space[6] }}>{footer}</View>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
}

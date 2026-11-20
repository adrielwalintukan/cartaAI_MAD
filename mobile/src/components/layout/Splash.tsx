import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme';

export function Splash() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }} accessibilityState={{ busy: true }} accessibilityLabel="Memuat">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

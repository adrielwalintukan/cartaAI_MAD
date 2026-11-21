import React from 'react';
import { View } from 'react-native';
import { Screen } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { ChatPanel, useChatSession } from '../ChatPanel';

/** Halaman Bantuan (dari menu): panel chat yang sama dengan popup, dalam bingkai halaman. */
export function ChatScreen() {
  const { colors, radius, space } = useTheme();
  const session = useChatSession();
  return (
    <Screen width="prose" scroll={false} style={{ flex: 1, paddingVertical: space[6] }}>
      <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <ChatPanel session={session} />
      </View>
    </Screen>
  );
}

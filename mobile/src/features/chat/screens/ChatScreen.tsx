import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Screen, Text, TextField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import type { ChatTurn } from '../../../types/api';
import { errMsg } from '../../invitations/ui';
import { useChatUsage, useSendChat } from '../hooks';

const HINTS = ['Bagaimana cara membagikan undangan ke tamu?', 'Apa bedanya paket Gratis dan Premium?', 'Bagaimana mengganti foto di undangan?'];

export function ChatScreen() {
  const { colors, radius, space } = useTheme();
  const usage = useChatUsage();
  const send = useSendChat();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);
  const remaining = usage.data?.remaining;

  const ask = (message: string) => {
    const m = message.trim();
    if (!m || send.isPending) return;
    const history = turns;
    setTurns([...history, { role: 'user', content: m }]); setText(''); setError(null);
    send.mutate({ message: m, history }, {
      onSuccess: (r) => { setTurns((t) => [...t, { role: 'bot', content: r.reply }]); setTimeout(() => scroller.current?.scrollToEnd(), 50); },
      onError: (e) => setError(errMsg(e)),
    });
  };

  return (
    <Screen width="prose" scroll={false} style={{ flex: 1, paddingVertical: space[6], gap: space[4] }}>
      <View style={{ gap: space[1] }}>
        <Text variant="h1">Bantuan</Text>
        <Text variant="bodySm" color="textMuted">Tanya soal cara memakai CartaAI.{remaining != null ? ` Sisa pertanyaan hari ini: ${remaining}.` : ''}</Text>
      </View>
      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ gap: space[3], paddingBottom: space[4] }}>
        {!turns.length ? (
          <View style={{ gap: space[2] }}>{HINTS.map((h) => <Button key={h} label={h} variant="secondary" onPress={() => ask(h)} />)}</View>
        ) : turns.map((t, i) => (
          <View key={i} style={{ alignSelf: t.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <View style={{ backgroundColor: t.role === 'user' ? colors.accent : colors.surface, borderRadius: radius.lg, padding: space[3], borderWidth: t.role === 'user' ? 0 : 1, borderColor: colors.border }}>
              <Text selectable color={t.role === 'user' ? 'onAccent' : 'text'}>{t.content}</Text>
            </View>
          </View>
        ))}
        {send.isPending ? <Text variant="bodySm" color="textMuted">Mengetik…</Text> : null}
        {error ? <Card variant="sunken"><Text variant="bodySm" color="danger">{error}</Text></Card> : null}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}><TextField label="Pertanyaan" value={text} onChangeText={setText} onSubmitEditing={() => ask(text)} returnKeyType="send" /></View>
        <Button label="Kirim" disabled={!text.trim() || remaining === 0} loading={send.isPending} onPress={() => ask(text)} />
      </View>
    </Screen>
  );
}

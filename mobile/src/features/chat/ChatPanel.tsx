import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Icon, Text } from '../../components/ui';
import { useTheme } from '../../theme';
import type { ChatTurn } from '../../types/api';
import { errMsg } from '../invitations/ui';
import { useChatUsage, useSendChat } from './hooks';

const HINTS = ['Cara membagikan undangan ke tamu', 'Beda paket Gratis dan Premium', 'Cara mengganti foto undangan'];
const EASE = Easing.out(Easing.exp);

/** Percakapan yang bertahan selama popup ditutup-buka (state dipegang pemanggil). */
export function useChatSession() {
  const send = useSendChat();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ask = (message: string) => {
    const m = message.trim();
    if (!m || send.isPending) return false;
    const history = turns;
    setTurns([...history, { role: 'user', content: m }]);
    setError(null);
    send.mutate({ message: m, history }, {
      onSuccess: (r) => setTurns((t) => [...t, { role: 'bot', content: r.reply }]),
      onError: (e) => setError(errMsg(e)),
    });
    return true;
  };
  return { turns, error, pending: send.isPending, ask };
}
export type ChatSession = ReturnType<typeof useChatSession>;

function Dot({ i }: { i: number }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!reduce) y.value = withDelay(i * 140, withRepeat(withSequence(withTiming(-3, { duration: 280 }), withTiming(0, { duration: 280 })), -1));
  }, [i, reduce, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSubtle }, st]} />;
}

/** Isi chat bantuan: kepala, percakapan, saran pertanyaan, dan kolom tulis. Dipakai popup dan halaman Bantuan. */
export function ChatPanel({ session, onClose }: { session: ChatSession; onClose?: () => void }) {
  const { colors, radius, space } = useTheme();
  const usage = useChatUsage();
  const remaining = usage.data?.remaining;
  const [text, setText] = useState('');
  const scroller = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const { turns, error, pending, ask } = session;
  const blocked = remaining === 0;
  const submit = (m: string) => { if (!blocked && ask(m)) setText(''); };

  useEffect(() => { const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60); return () => clearTimeout(t); }, [turns.length, pending, error]);
  // Web: fokus langsung ke kolom tulis saat popup terbuka.
  useEffect(() => { if (Platform.OS === 'web') input.current?.focus(); }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[3], paddingHorizontal: space[5], paddingTop: space[5], paddingBottom: space[4], borderBottomWidth: 1, borderColor: colors.border }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="overline" color="accent">Bantuan CartaAI</Text>
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 30, color: colors.text, letterSpacing: -0.3 }}>
            Ada yang bisa <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 24, lineHeight: 30, color: colors.accent }}>dibantu</Text>?
          </Text>
          <Text variant="caption" color="textSubtle">{remaining != null ? `${remaining} pertanyaan tersisa hari ini` : 'Jawaban dari asisten AI, bisa keliru'}</Text>
        </View>
        {onClose ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Tutup bantuan" onPress={onClose} hitSlop={8}
            style={({ hovered }: { hovered?: boolean }) => ({ width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? colors.surfaceSunken : 'transparent' })}>
            <Icon name="x" size={20} color="textMuted" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ padding: space[5], gap: space[3], flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {!turns.length ? (
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: space[3] }}>
            <Text variant="bodySm" color="textMuted">Tanya apa saja soal membuat, membagikan, atau meng-upgrade undanganmu. Coba salah satu:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {HINTS.map((h) => (
                <Pressable key={h} accessibilityRole="button" disabled={blocked} onPress={() => submit(h)}
                  style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => ({
                    paddingHorizontal: space[4], minHeight: 36, justifyContent: 'center', borderRadius: radius.full, borderWidth: 1,
                    borderColor: hovered ? colors.accent : colors.border, backgroundColor: hovered ? colors.accentSoft : colors.surface,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}>
                  <Text variant="bodySm">{h}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : turns.map((t, i) => {
          const me = t.role === 'user';
          return (
            <Animated.View key={i} entering={FadeInDown.duration(450).easing(EASE)} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
              <View style={{
                backgroundColor: me ? colors.accent : colors.surfaceSunken, paddingHorizontal: space[4], paddingVertical: space[3],
                borderRadius: radius.lg, borderBottomRightRadius: me ? 4 : radius.lg, borderBottomLeftRadius: me ? radius.lg : 4,
              }}>
                <Text selectable color={me ? 'onAccent' : 'text'} style={{ lineHeight: 22 }}>{t.content}</Text>
              </View>
            </Animated.View>
          );
        })}
        {pending ? (
          <Animated.View entering={FadeIn.duration(200)} accessibilityLabel="Asisten sedang mengetik"
            style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 5, paddingHorizontal: space[4], paddingVertical: space[4], borderRadius: radius.lg, borderBottomLeftRadius: 4, backgroundColor: colors.surfaceSunken }}>
            {[0, 1, 2].map((i) => <Dot key={i} i={i} />)}
          </Animated.View>
        ) : null}
        {error ? (
          <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-start', padding: space[3], borderRadius: radius.md, backgroundColor: colors.dangerSoft }}>
            <Icon name="alert-circle" size={16} color="danger" />
            <Text variant="bodySm" color="danger" style={{ flex: 1 }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ padding: space[4], borderTopWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], paddingLeft: space[4], paddingRight: 6, minHeight: 52, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <TextInput
            ref={input}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit(text)}
            editable={!blocked}
            placeholder={blocked ? 'Kuota hari ini habis, coba lagi besok' : 'Tulis pertanyaanmu…'}
            placeholderTextColor={colors.textSubtle}
            accessibilityLabel="Pertanyaan"
            returnKeyType="send"
            blurOnSubmit={false}
            maxLength={500}
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text, paddingVertical: 10, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as object : null) }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Kirim" disabled={!text.trim() || pending || blocked} onPress={() => submit(text)}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.accent, opacity: !text.trim() || pending || blocked ? 0.35 : 1, transform: [{ scale: pressed ? 0.94 : 1 }],
            })}>
            <Icon name="arrow-up" size={20} color="onAccent" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme';

/** Angka menghitung naik (easeOutExpo, 900 ms); langsung tampil bila pengguna mengurangi gerak. */
function CountUp({ to, style }: { to: number; style: object }) {
  const still = useReducedMotion();
  const [n, setN] = useState(still ? to : 0);
  useEffect(() => {
    if (still) { setN(to); return; }
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / 900);
      setN(Math.round(to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, still]);
  return <Text style={style}>{n}</Text>;
}

export type Stat = { label: string; value: number | null };

/** Grid editorial: sel dipisah garis rambut, bukan kartu berbayang. 4 kolom desktop, 2×2 ponsel. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  const { space, colors, bp } = useTheme();
  const mobile = bp === 'mobile';
  const num = { fontFamily: 'Fraunces_600SemiBold', fontSize: mobile ? 40 : 56, lineHeight: mobile ? 44 : 60, color: colors.text, letterSpacing: -1 };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }}>
      {stats.map((s, i) => {
        const col = mobile ? i % 2 : i;
        return (
          <View key={s.label} style={{
            width: mobile ? '50%' : '25%', paddingVertical: space[5], paddingLeft: col === 0 ? 0 : space[5], gap: space[1],
            borderLeftWidth: col === 0 ? 0 : 1, borderTopWidth: mobile && i >= 2 ? 1 : 0, borderColor: colors.border,
          }}>
            {s.value == null ? <Text style={num}>—</Text> : <CountUp to={s.value} style={num} />}
            <Text variant="overline" color="textMuted">{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

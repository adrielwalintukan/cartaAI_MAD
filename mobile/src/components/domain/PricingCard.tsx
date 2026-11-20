import React from 'react';
import { View } from 'react-native';
import { formatRupiah } from '../../lib/format';
import { useTheme } from '../../theme';
import { Badge, Button, Card, Icon, Text } from '../ui';

export type PricingFeature = { text: string; included: boolean };

type Props = {
  name: string;
  price: number;
  priceNote: string;
  description: string;
  features: PricingFeature[];
  ctaLabel: string;
  onPress?: () => void;
  href?: string;
  highlighted?: boolean;
  badge?: string;
};

/** Gratis / Premium. Premium: border aksen 1,5px + badge; tanpa gradien, bayangan, atau skala. */
export function PricingCard({ name, price, priceNote, description, features, ctaLabel, onPress, href, highlighted, badge }: Props) {
  const { space, t } = useTheme();
  return (
    <Card selected={highlighted} role="group" accessibilityLabel={`Paket ${name}`} style={{ gap: space[4], maxWidth: 400, width: '100%', padding: space[6] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="overline" color="textMuted">{name}</Text>
        {badge ? <Badge label={badge} tone="accent" /> : null}
      </View>
      <View>
        <Text style={{ ...t('h1'), fontSize: 40, lineHeight: 46 }}>{formatRupiah(price)}</Text>
        <Text variant="bodySm" color="textMuted">{priceNote}</Text>
      </View>
      <Text color="textMuted">{description}</Text>
      <View style={{ gap: space[3] }} role="list">
        {features.map((f) => (
          <View key={f.text} role="listitem" style={{ flexDirection: 'row', gap: space[3], alignItems: 'flex-start' }}>
            <Icon name={f.included ? 'check' : 'minus'} color={f.included ? 'accent' : 'textSubtle'} />
            <Text variant="bodySm" color={f.included ? 'text' : 'textMuted'} style={{ flex: 1 }}>
              <Text variant="bodySm" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}>{f.included ? 'Termasuk: ' : 'Tidak termasuk: '}</Text>
              {f.text}
            </Text>
          </View>
        ))}
      </View>
      <Button label={ctaLabel} variant={highlighted ? 'primary' : 'secondary'} size="lg" fullWidth onPress={onPress} href={href} />
    </Card>
  );
}

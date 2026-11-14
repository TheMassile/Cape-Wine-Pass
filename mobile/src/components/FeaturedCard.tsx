import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeaturedSpot } from '@/lib/featured';
import { colors, fonts, space } from '@/lib/theme';

export function FeaturedCard({ spot, estateName }: { spot: FeaturedSpot; estateName: string }) {
  const label =
    spot.slot === 'farm_of_week'
      ? 'Wine farm of the week'
      : `Red of the region${spot.region ? ` · ${spot.region}` : ''}`;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/estate/[id]', params: { id: spot.estateId } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.name}>{estateName}</Text>
      {!!spot.wineName && <Text style={styles.wine}>{spot.wineName}</Text>}
      {!!spot.blurb && <Text style={styles.blurb}>{spot.blurb}</Text>}
      <View style={styles.footer}>
        <Text style={styles.sponsored}>Sponsored</Text>
        {!!spot.linkUrl && (
          <Pressable onPress={() => Linking.openURL(spot.linkUrl!)} hitSlop={8}>
            <Text style={styles.link}>Book or shop ↗</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(212,174,122,0.45)',
    padding: space.md,
    gap: space.xs,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  name: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  wine: { fontFamily: fonts.sans, fontSize: 13, color: colors.goldLight },
  blurb: { fontFamily: fonts.sansLight, fontSize: 13, lineHeight: 20, color: colors.soft },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
  },
  sponsored: {
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  link: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.goldLight,
  },
});

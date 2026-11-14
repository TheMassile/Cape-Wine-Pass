import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Body, Button, ErrorText, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchEstates, fetchMyCheckins, fetchVisitedIds, type Checkin, type Estate } from '@/lib/data';
import { colors, fonts, space } from '@/lib/theme';

type CardData = { checkin: Checkin; estate: Estate | undefined; visited: number; total: number };

// A good-looking picture of one visit, ready for Instagram, WhatsApp and friends.
export default function ShareScreen() {
  const { checkinId } = useLocalSearchParams<{ checkinId: string }>();
  const { session } = useAuth();
  const myId = session?.user.id;
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [data, setData] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!myId || !checkinId) return;
    Promise.all([fetchMyCheckins(myId), fetchEstates(), fetchVisitedIds(myId)])
      .then(([checkins, estates, visitedIds]) => {
        const checkin = checkins.find((c) => c.id === checkinId);
        if (!checkin) throw new Error('Visit not found.');
        const open = new Set(estates.map((e) => e.id));
        setData({
          checkin,
          estate: estates.find((e) => e.id === checkin.estate_id),
          visited: [...visitedIds].filter((id) => open.has(id)).length,
          total: estates.length,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this visit.'));
  }, [myId, checkinId]);

  async function share() {
    setSharing(true);
    setError(null);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, width: 1080 });
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this phone.");
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your visit' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not share.');
    } finally {
      setSharing(false);
    }
  }

  if (!data && !error) return <Loading />;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
      {data && (
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <Text style={styles.brand}>Cape Wine Pass</Text>
          <View style={{ gap: space.sm }}>
            <Text style={styles.region}>{data.estate?.region ?? ''}</Text>
            <Text style={styles.estate}>{data.estate?.name ?? 'A Cape wine estate'}</Text>
            <Text style={styles.date}>
              {new Date(data.checkin.visited_at).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {data.checkin.verified ? '  ·  ✓ Checked in on the spot' : ''}
            </Text>
            {data.checkin.rating != null && (
              <Text style={styles.stars}>
                {'★'.repeat(data.checkin.rating)}
                <Text style={{ color: colors.muted }}>{'★'.repeat(5 - data.checkin.rating)}</Text>
              </Text>
            )}
            {!!data.checkin.note && (
              <Text style={styles.note} numberOfLines={5}>
                “{data.checkin.note}”
              </Text>
            )}
          </View>
          <View style={styles.footer}>
            <Text style={styles.count}>
              <Text style={{ color: colors.goldLight }}>{data.visited}</Text> of {data.total} estates
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(data.visited / Math.max(1, data.total)) * 100}%` }]} />
            </View>
            <Text style={styles.url}>capewinepass.co.za</Text>
          </View>
        </View>
      )}
      {error && <ErrorText message={error} />}
      {data && (
        <>
          <Button label="Share" onPress={share} loading={sharing} />
          <Body muted style={{ textAlign: 'center', fontSize: 12 }}>
            Opens your phone&apos;s share menu: Instagram, WhatsApp, Messages and more.
          </Body>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.md },
  card: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: space.xl,
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  region: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  estate: { fontFamily: fonts.serifLight, fontSize: 38, lineHeight: 42, color: colors.text },
  date: { fontFamily: fonts.sansLight, fontSize: 12, color: colors.soft },
  stars: { fontSize: 22, letterSpacing: 3, color: colors.goldLight },
  note: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24, color: colors.soft },
  footer: { gap: space.sm },
  count: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  track: { height: 2, backgroundColor: 'rgba(184,150,90,0.15)' },
  fill: { height: 2, backgroundColor: colors.gold },
  url: { fontFamily: fonts.sansLight, fontSize: 11, letterSpacing: 1, color: colors.muted },
});

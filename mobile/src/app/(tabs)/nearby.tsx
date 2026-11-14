import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, ErrorText, Eyebrow, Loading, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchEstates, fetchVisitedIds, type Estate } from '@/lib/data';
import { distanceMetres, formatDistance, getMyLocation, type Coords } from '@/lib/location';
import { colors, fonts, space } from '@/lib/theme';

const SHOW = 40;

export default function NearbyScreen() {
  const { session } = useAuth();
  const [estates, setEstates] = useState<Estate[] | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [here, setHere] = useState<Coords | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    return getMyLocation()
      .then(setHere)
      .catch(() => setHere(null));
  }, []);

  useEffect(() => {
    Promise.all([
      fetchEstates(),
      session ? fetchVisitedIds(session.user.id) : Promise.resolve(new Set<string>()),
    ])
      .then(([all, mine]) => {
        setEstates(all);
        setVisited(mine);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load estates.'));
    locate();
  }, [session, locate]);

  const nearest = useMemo(() => {
    if (!here || !estates) return [];
    return estates
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({ estate: e, metres: distanceMetres(here, { latitude: e.latitude!, longitude: e.longitude! }) }))
      .sort((a, b) => a.metres - b.metres)
      .slice(0, SHOW);
  }, [here, estates]);

  if (here === undefined || (!estates && !error)) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {here === null ? (
        <View style={styles.empty}>
          <Eyebrow>Near me</Eyebrow>
          <Title>Where are you?</Title>
          <Body>Allow location access to see the wine estates closest to you, and to check in when you arrive.</Body>
          <Button label="Try again" onPress={locate} />
          <Button variant="outline" label="Open phone settings" onPress={() => Linking.openSettings()} />
        </View>
      ) : (
        <FlatList
          data={nearest}
          keyExtractor={(r) => r.estate.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={{ gap: space.sm, marginBottom: space.lg }}>
              <Eyebrow>Near me</Eyebrow>
              <Title>Closest estates</Title>
              {error && <ErrorText message={error} />}
            </View>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/estate/[id]', params: { id: item.estate.id } }} asChild>
              <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{item.estate.name}</Text>
                  <Body muted style={{ fontSize: 12 }}>
                    {item.estate.region}
                    {visited.has(item.estate.id) ? '  ·  Visited ✓' : ''}
                  </Body>
                </View>
                <Text style={styles.distance}>{formatDistance(item.metres)}</Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.lg, gap: 1 },
  empty: { padding: space.lg, gap: space.md, flex: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: space.md,
  },
  name: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  distance: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.goldLight },
});

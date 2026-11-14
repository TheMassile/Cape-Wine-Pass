import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { FeaturedCard } from '@/components/FeaturedCard';
import { Body, ErrorText, Eyebrow, Loading, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchFeatured, type FeaturedSpot } from '@/lib/featured';
import { fetchEstates, fetchVisitedIds, type Estate } from '@/lib/data';
import { colors, fonts, space } from '@/lib/theme';

export default function RegionScreen() {
  const { region } = useLocalSearchParams<{ region: string }>();
  const { session } = useAuth();
  const [estates, setEstates] = useState<Estate[] | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [red, setRed] = useState<FeaturedSpot | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [all, mine] = await Promise.all([
          fetchEstates(),
          session ? fetchVisitedIds(session.user.id) : Promise.resolve(new Set<string>()),
        ]);
        const here = all.filter((e) => e.region === region);
        setEstates(here);
        setVisited(mine);
        const ids = new Set(here.map((e) => e.id));
        fetchFeatured()
          .then((spots) =>
            setRed(
              spots.find((f) => f.slot === 'red_of_region' && (f.region === region || ids.has(f.estateId))) ??
                null,
            ),
          )
          .catch(() => setRed(null));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load estates.');
      }
    })();
  }, [region, session]);

  const done = useMemo(() => (estates ?? []).filter((e) => visited.has(e.id)).length, [estates, visited]);

  if (!estates && !error) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: region }} />
      <FlatList
        data={estates ?? []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Eyebrow>
              {done} of {estates?.length ?? 0} visited
            </Eyebrow>
            <ProgressBar value={estates?.length ? done / estates.length : 0} />
            {error && <ErrorText message={error} />}
            {red && (
              <FeaturedCard
                spot={red}
                estateName={estates?.find((e) => e.id === red.estateId)?.name ?? 'A local estate'}
              />
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isVisited = visited.has(item.id);
          const tags = [
            item.publicTasting === 'Y' && 'Tastings',
            item.appointmentOnly === 'Y' && 'By appointment',
            item.restaurant === 'Y' && 'Restaurant',
          ].filter(Boolean);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/estate/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name}>{item.name}</Text>
                {tags.length > 0 && (
                  <Body muted style={styles.tags}>
                    {tags.join(' · ')}
                  </Body>
                )}
              </View>
              {isVisited && <Text style={styles.visited}>Visited ✓</Text>}
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: 1 },
  header: { gap: space.sm, marginBottom: space.lg },
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
  tags: { fontSize: 11, lineHeight: 16 },
  visited: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.5, color: colors.goldLight },
});

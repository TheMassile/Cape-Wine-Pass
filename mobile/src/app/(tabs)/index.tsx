import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeaturedCard } from '@/components/FeaturedCard';
import { Body, ErrorText, Eyebrow, Loading, ProgressBar, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { regionProgress, type RegionProgress } from '@/lib/badges';
import { fetchFeatured, type FeaturedSpot } from '@/lib/featured';
import { fetchEstates, fetchVisitedIds, type Estate } from '@/lib/data';
import { colors, fonts, space } from '@/lib/theme';

export default function ExploreScreen() {
  const { session } = useAuth();
  const [estates, setEstates] = useState<Estate[] | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [featured, setFeatured] = useState<FeaturedSpot[]>([]);

  // Fetch everything, then put it on screen. Used on open and on pull-to-refresh.
  const fetchAll = useCallback(
    () =>
      Promise.all([
        fetchEstates(),
        session ? fetchVisitedIds(session.user.id) : Promise.resolve(new Set<string>()),
      ]),
    [session],
  );

  const show = useCallback((p: Promise<[Estate[], Set<string>]>) => {
    return p
      .then(([all, mine]) => {
        setError(null);
        setEstates(all);
        setVisited(mine);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load estates.'));
  }, []);

  const load = useCallback(() => show(fetchAll()), [show, fetchAll]);

  // Reload each time you come back to this tab, so new check-ins count straight away.
  useFocusEffect(
    useCallback(() => {
      show(fetchAll());
      // Sponsored spots are optional extras: if they fail to load, just don't show them.
      fetchFeatured()
        .then(setFeatured)
        .catch(() => setFeatured([]));
    }, [show, fetchAll]),
  );

  const regions = useMemo<RegionProgress[]>(() => regionProgress(estates ?? [], visited), [estates, visited]);

  if (!estates && !error) return <Loading />;

  const total = estates?.length ?? 0;
  const done = estates?.filter((e) => visited.has(e.id)).length ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={regions}
        keyExtractor={(r) => r.name}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.gold}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Eyebrow>Your Cape journey</Eyebrow>
            <Title>
              <Text style={{ color: colors.goldLight }}>{done}</Text> of {total} estates
            </Title>
            <ProgressBar value={total ? done / total : 0} />
            {error && <ErrorText message={error} />}
            {featured.map((f) => (
              <FeaturedCard
                key={f.id}
                spot={f}
                estateName={estates?.find((e) => e.id === f.estateId)?.name ?? 'A Cape wine estate'}
              />
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/region/[region]', params: { region: item.name } })}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1, gap: space.sm }}>
              <Text style={styles.regionName}>{item.name}</Text>
              <ProgressBar value={item.total ? item.visited / item.total : 0} />
            </View>
            <Body style={styles.count}>
              {item.total > 0 && item.visited === item.total ? '★ Complete' : `${item.visited}/${item.total}`}
            </Body>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  regionName: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  count: { color: colors.goldLight, fontFamily: fonts.sansMedium, fontSize: 12 },
});

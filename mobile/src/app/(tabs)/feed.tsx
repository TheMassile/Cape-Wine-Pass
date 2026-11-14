import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, ErrorText, Eyebrow, Loading, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cheer, fetchFeed, fetchMyFollows, timeAgo, uncheer, type FeedItem } from '@/lib/social';
import { openSafetyMenu } from '@/lib/safetyMenu';
import { colors, fonts, space } from '@/lib/theme';

export default function FeedScreen() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [requests, setRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!myId) return Promise.resolve();
    return Promise.all([fetchFeed(myId), fetchMyFollows(myId)])
      .then(([feed, follows]) => {
        setError(null);
        setItems(feed);
        setRequests(follows.requests.length);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the feed.'));
  }, [myId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Cheer straight away on screen, then save; undo if saving fails.
  function toggleCheer(item: FeedItem) {
    if (!myId || item.mine) return;
    const next = !item.cheeredByMe;
    setItems((list) =>
      (list ?? []).map((i) =>
        i.id === item.id ? { ...i, cheeredByMe: next, cheers: i.cheers + (next ? 1 : -1) } : i,
      ),
    );
    (next ? cheer(myId, item.id) : uncheer(myId, item.id)).catch(() => load());
  }

  if (!items && !error) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items ?? []}
        keyExtractor={(i) => i.id}
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
            <Eyebrow>Feed</Eyebrow>
            <Title>Who&apos;s been where</Title>
            <Pressable onPress={() => router.push('/people')} style={styles.findRow}>
              <Text style={styles.findText}>Find people to follow</Text>
              {requests > 0 && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {requests} request{requests === 1 ? '' : 's'}
                  </Text>
                </View>
              )}
            </Pressable>
            {error && <ErrorText message={error} />}
          </View>
        }
        ListEmptyComponent={
          <Card style={{ gap: space.md }}>
            <Body>
              Nothing here yet. Follow friends to see their estate visits, and your own check-ins will show
              here too.
            </Body>
            <Button label="Find people" onPress={() => router.push('/people')} />
          </Card>
        }
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        renderItem={({ item }) => (
          <Card style={{ gap: space.sm }}>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { flex: 1 }]}>
                {item.who} · {timeAgo(item.visitedAt)}
                {item.verified ? ' · ✓ at the estate' : ''}
              </Text>
              {!item.mine && (
                <Pressable
                  hitSlop={12}
                  accessibilityLabel="Report or block"
                  onPress={() =>
                    openSafetyMenu({
                      userId: item.userId,
                      name: item.who,
                      checkinId: item.id,
                      onBlocked: load,
                    })
                  }>
                  <Text style={styles.more}>⋯</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/estate/[id]', params: { id: item.estateId } })}>
              <Text style={styles.estate}>{item.estateName}</Text>
              {!!item.region && <Body muted>{item.region}</Body>}
            </Pressable>
            {item.rating != null && (
              <Text style={styles.stars}>{'★'.repeat(item.rating) + '☆'.repeat(5 - item.rating)}</Text>
            )}
            {!!item.note && <Body>{item.note}</Body>}
            {item.mine ? (
              item.cheers > 0 && (
                <Text style={styles.cheerText}>
                  🥂 {item.cheers} cheer{item.cheers === 1 ? '' : 's'}
                </Text>
              )
            ) : (
              <Pressable
                onPress={() => toggleCheer(item)}
                style={({ pressed }) => [styles.cheer, pressed && { opacity: 0.6 }]}>
                <Text style={[styles.cheerText, item.cheeredByMe && { color: colors.goldLight }]}>
                  🥂 {item.cheeredByMe ? 'Cheered' : 'Cheers'}
                  {item.cheers > 0 ? ` · ${item.cheers}` : ''}
                </Text>
              </Pressable>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.lg },
  header: { gap: space.sm, marginBottom: space.lg },
  findRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  findText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.goldLight,
  },
  pill: { backgroundColor: colors.wine, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 10 },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  more: { fontSize: 20, color: colors.muted, paddingHorizontal: space.xs },
  meta: { fontFamily: fonts.sansLight, fontSize: 12, color: colors.muted },
  estate: { fontFamily: fonts.serif, fontSize: 22, color: colors.text },
  stars: { color: colors.goldLight, fontSize: 16, letterSpacing: 2 },
  cheer: { alignSelf: 'flex-start', paddingVertical: space.xs },
  cheerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.soft },
});

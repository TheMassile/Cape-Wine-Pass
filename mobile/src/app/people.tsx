import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, ErrorText, Eyebrow } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  approveRequest,
  fetchMyFollows,
  fetchPeople,
  follow,
  personName,
  removeFollower,
  searchPeople,
  unfollow,
  type Follow,
  type Person,
} from '@/lib/social';
import { fetchBlocked, unblockUser } from '@/lib/safety';
import { colors, fonts, space } from '@/lib/theme';

type Follows = { following: Follow[]; followers: Follow[]; requests: Follow[] };

// Find people, follow them, and answer requests to follow you.
export default function PeopleScreen() {
  const { session } = useAuth();
  const myId = session?.user.id ?? '';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [follows, setFollows] = useState<Follows>({ following: [], followers: [], requests: [] });
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);

  const loadFollows = useCallback(async () => {
    if (!myId) return;
    try {
      const [f, b] = await Promise.all([
        fetchMyFollows(myId),
        fetchBlocked(myId).catch(() => [] as string[]),
      ]);
      setBlocked(b);
      const ids = [...f.following.map((r) => r.followee_id), ...f.requests.map((r) => r.follower_id), ...b];
      setPeople(await fetchPeople([...new Set(ids)]));
      setFollows(f);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load.');
    }
  }, [myId]);

  useFocusEffect(
    useCallback(() => {
      loadFollows();
    }, [loadFollows]),
  );

  // Search as you type, after a short pause.
  useEffect(() => {
    if (!myId) return;
    const t = setTimeout(() => {
      searchPeople(query, myId)
        .then(setResults)
        .catch((e) => setError(e instanceof Error ? e.message : 'Search failed.'));
    }, 300);
    return () => clearTimeout(t);
  }, [query, myId]);

  async function run(action: () => Promise<void>) {
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    await loadFollows();
  }

  function statusOf(personId: string) {
    return follows.following.find((f) => f.followee_id === personId)?.status ?? null;
  }

  const showingSearch = query.trim().length >= 2;
  const list: Person[] = showingSearch
    ? results
    : follows.following.map(
        (f) => people.get(f.followee_id) ?? { user_id: f.followee_id, handle: null, display_name: null },
      );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.pad}
      data={list}
      keyExtractor={(p) => p.user_id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.md }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or @handle"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          {error && <ErrorText message={error} />}

          {!showingSearch && follows.requests.length > 0 && (
            <View style={{ gap: space.sm }}>
              <Eyebrow>Requests to follow you</Eyebrow>
              {follows.requests.map((r) => (
                <View key={r.follower_id} style={styles.row}>
                  <Text style={styles.name}>{personName(people.get(r.follower_id))}</Text>
                  <SmallButton
                    label="Approve"
                    onPress={() => run(() => approveRequest(myId, r.follower_id))}
                  />
                  <SmallButton
                    label="Decline"
                    quiet
                    onPress={() => run(() => removeFollower(myId, r.follower_id))}
                  />
                </View>
              ))}
            </View>
          )}

          {!showingSearch && blocked.length > 0 && (
            <View style={{ gap: space.sm }}>
              <Eyebrow>Blocked</Eyebrow>
              {blocked.map((id) => (
                <View key={id} style={styles.row}>
                  <Text style={[styles.name, { flex: 1 }]}>{personName(people.get(id))}</Text>
                  <SmallButton label="Unblock" quiet onPress={() => run(() => unblockUser(myId, id))} />
                </View>
              ))}
            </View>
          )}

          <Eyebrow>{showingSearch ? 'People' : `Following (${follows.following.length})`}</Eyebrow>
        </View>
      }
      ListEmptyComponent={
        <Body muted>
          {showingSearch
            ? 'No one found. People need a handle on the website to be findable.'
            : 'Search above to find friends to follow.'}
        </Body>
      }
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item }) => {
        const status = statusOf(item.user_id);
        return (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{personName(item)}</Text>
              {item.display_name && item.handle && <Body muted>@{item.handle}</Body>}
            </View>
            {status === 'accepted' ? (
              <SmallButton label="Following" quiet onPress={() => run(() => unfollow(myId, item.user_id))} />
            ) : status === 'pending' ? (
              <SmallButton label="Requested" quiet onPress={() => run(() => unfollow(myId, item.user_id))} />
            ) : (
              <SmallButton label="Follow" onPress={() => run(() => follow(myId, item.user_id))} />
            )}
          </View>
        );
      }}
    />
  );
}

function SmallButton({ label, onPress, quiet }: { label: string; onPress: () => void; quiet?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.small,
        quiet ? styles.smallQuiet : styles.smallMain,
        pressed && { opacity: 0.7 },
      ]}>
      <Text style={[styles.smallText, quiet && { color: colors.soft }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    padding: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: space.md,
  },
  name: { flexShrink: 1, fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  small: { paddingHorizontal: space.md, paddingVertical: space.sm, borderWidth: 1 },
  smallMain: { backgroundColor: colors.wine, borderColor: colors.wineLight },
  smallQuiet: { backgroundColor: 'transparent', borderColor: colors.border },
  smallText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text,
  },
});

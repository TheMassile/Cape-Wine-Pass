import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadgeTile } from '@/components/BadgeTile';
import { Body, Button, Card, ErrorText, Eyebrow, Loading, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { RANK_COLOURS, nextRankText } from '@/lib/badges';
import { fetchProfile } from '@/lib/data';
import { fetchMyFollows, fetchMyVisibility, setMyVisibility, type Visibility } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/lib/theme';
import { useJourney } from '@/lib/useJourney';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchProfile>>>(null);
  const { summary, error, reload } = useJourney();
  const [refreshing, setRefreshing] = useState(false);

  const [counts, setCounts] = useState({ followers: 0, following: 0, requests: 0 });
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [visError, setVisError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchProfile(session.user.id)
      .then(setProfile)
      .catch(() => setProfile(null));
    fetchMyVisibility(session.user.id)
      .then(setVisibility)
      .catch(() => setVisibility(null));
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      fetchMyFollows(session.user.id)
        .then((f) =>
          setCounts({
            followers: f.followers.length,
            following: f.following.filter((x) => x.status === 'accepted').length,
            requests: f.requests.length,
          }),
        )
        .catch(() => {});
    }, [session]),
  );

  async function changeVisibility(v: Visibility) {
    if (!session) return;
    const before = visibility;
    setVisibility(v);
    setVisError(null);
    try {
      await setMyVisibility(session.user.id, v);
    } catch (e) {
      setVisibility(before);
      setVisError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  if (!summary && !error) return <Loading />;

  const name = profile?.display_name || (profile?.handle ? `@${profile.handle}` : session?.user.email);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.gold}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
          />
        }>
        <Eyebrow>Your profile</Eyebrow>
        <Title>{name}</Title>
        {profile?.handle && profile.display_name && <Body muted>@{profile.handle}</Body>}
        {error && <ErrorText message={error} />}

        {summary && (
          <>
            <Card style={[styles.rankCard, { borderColor: RANK_COLOURS[summary.rank] }]}>
              <Eyebrow>Rank</Eyebrow>
              <Text style={[styles.rank, { color: RANK_COLOURS[summary.rank] }]}>{summary.rank}</Text>
              <Body muted>{nextRankText(summary.visitedCount, summary.total)}</Body>
            </Card>

            <View style={styles.stats}>
              <Card style={styles.stat}>
                <Eyebrow>Estates</Eyebrow>
                <Text style={styles.statValue}>{summary.visitedCount}</Text>
              </Card>
              <Card style={styles.stat}>
                <Eyebrow>Check-ins</Eyebrow>
                <Text style={styles.statValue}>{summary.checkinCount}</Text>
              </Card>
              <Card style={styles.stat}>
                <Eyebrow>Badges</Eyebrow>
                <Text style={styles.statValue}>{summary.earned.length}</Text>
              </Card>
            </View>

            <Pressable onPress={() => router.push('/people')} style={styles.stats}>
              <Card style={styles.stat}>
                <Eyebrow>Followers</Eyebrow>
                <Text style={styles.statValue}>{counts.followers}</Text>
              </Card>
              <Card style={styles.stat}>
                <Eyebrow>Following</Eyebrow>
                <Text style={styles.statValue}>{counts.following}</Text>
              </Card>
              <Card style={styles.stat}>
                <Eyebrow>Requests</Eyebrow>
                <Text style={[styles.statValue, counts.requests > 0 && { color: colors.wineLight }]}>
                  {counts.requests}
                </Text>
              </Card>
            </Pressable>

            {summary.nextUp.length > 0 && (
              <View style={styles.section}>
                <Eyebrow>Next up</Eyebrow>
                {summary.nextUp.map((b) => (
                  <BadgeTile key={b.id} badge={b} />
                ))}
              </View>
            )}

            {summary.earned.length > 0 && (
              <View style={styles.section}>
                <Eyebrow>Earned</Eyebrow>
                {summary.earned.map((b) => (
                  <BadgeTile key={b.id} badge={b} />
                ))}
              </View>
            )}

            <Link href="/badges" asChild>
              <Text style={styles.link}>See all {summary.badges.length} badges</Text>
            </Link>
          </>
        )}

        <View style={styles.section}>
          <Eyebrow>Who can see your visits</Eyebrow>
          <View style={styles.choices}>
            {VISIBILITY.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => changeVisibility(o.value)}
                style={[styles.choice, visibility === o.value && styles.choiceOn]}>
                <Text style={[styles.choiceLabel, visibility === o.value && { color: colors.text }]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Body muted>{VISIBILITY.find((o) => o.value === visibility)?.help ?? ''}</Body>
          {visError && <ErrorText message={visError} />}
        </View>

        <View style={{ marginTop: space.lg }}>
          <Button variant="outline" label="Sign out" onPress={() => supabase.auth.signOut()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const VISIBILITY: { value: Visibility; label: string; help: string }[] = [
  { value: 'public', label: 'Everyone', help: 'Anyone can follow you and see your check-ins.' },
  {
    value: 'friends',
    label: 'Followers',
    help: 'People must ask to follow you, and only approved followers see your check-ins.',
  },
  { value: 'private', label: 'Only me', help: 'Nobody can follow you or see your check-ins.' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, gap: space.sm },
  rankCard: { gap: space.xs, marginTop: space.md },
  rank: { fontFamily: fonts.serifLight, fontSize: 40 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: space.xs },
  statValue: { fontFamily: fonts.serifLight, fontSize: 30, color: colors.goldLight },
  section: { gap: space.sm, marginTop: space.md },
  choices: { flexDirection: 'row', gap: space.sm },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  choiceOn: { backgroundColor: colors.wine, borderColor: colors.wineLight },
  choiceLabel: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1, color: colors.soft },
  link: {
    marginTop: space.md,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.goldLight,
    textAlign: 'center',
    paddingVertical: space.sm,
  },
});

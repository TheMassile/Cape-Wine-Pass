import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadgeTile } from '@/components/BadgeTile';
import { Body, Button, Card, ErrorText, Eyebrow, Loading, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { RANK_COLOURS, nextRankText } from '@/lib/badges';
import { fetchProfile } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/lib/theme';
import { useJourney } from '@/lib/useJourney';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchProfile>>>(null);
  const { summary, error, reload } = useJourney();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchProfile(session.user.id).then(setProfile).catch(() => setProfile(null));
  }, [session]);

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

        <View style={{ marginTop: space.lg }}>
          <Button variant="outline" label="Sign out" onPress={() => supabase.auth.signOut()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, gap: space.sm },
  rankCard: { gap: space.xs, marginTop: space.md },
  rank: { fontFamily: fonts.serifLight, fontSize: 40 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: space.xs },
  statValue: { fontFamily: fonts.serifLight, fontSize: 30, color: colors.goldLight },
  section: { gap: space.sm, marginTop: space.md },
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

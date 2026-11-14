import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, Eyebrow, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchProfile, fetchVisitedIds } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchProfile>>>(null);
  const [visitedCount, setVisitedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchProfile(session.user.id).then(setProfile).catch(() => setProfile(null));
    fetchVisitedIds(session.user.id)
      .then((s) => setVisitedCount(s.size))
      .catch(() => setVisitedCount(null));
  }, [session]);

  const name = profile?.display_name || (profile?.handle ? `@${profile.handle}` : session?.user.email);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>Your profile</Eyebrow>
        <Title>{name}</Title>
        {profile?.handle && profile.display_name && <Body muted>@{profile.handle}</Body>}

        <Card style={{ gap: space.xs, marginTop: space.md }}>
          <Eyebrow>Estates visited</Eyebrow>
          <Title style={{ color: colors.goldLight }}>{visitedCount ?? '…'}</Title>
        </Card>

        <Body muted style={{ marginTop: space.lg }}>
          Friends, badges and check-ins are coming next.
        </Body>

        <Button variant="outline" label="Sign out" onPress={() => supabase.auth.signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, gap: space.sm },
});

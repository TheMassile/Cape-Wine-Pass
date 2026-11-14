import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, ErrorText, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchLeaderboards, type Leaderboards } from '@/lib/social';
import { colors, fonts, space } from '@/lib/theme';

type Period = 'month' | 'allTime';

export default function LeaderboardScreen() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const [boards, setBoards] = useState<Leaderboards | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!myId) return;
      fetchLeaderboards(myId)
        .then((b) => {
          setError(null);
          setBoards(b);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the leaderboard.'));
    }, [myId]),
  );

  if (!boards && !error) return <Loading />;

  const rows = boards?.[period] ?? [];
  const monthName = new Date().toLocaleDateString('en-ZA', { month: 'long' });

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.pad}
      data={rows}
      keyExtractor={(r) => r.userId}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.md }}>
          <View style={styles.choices}>
            {(
              [
                ['month', monthName],
                ['allTime', 'All time'],
              ] as [Period, string][]
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setPeriod(value)}
                style={[styles.choice, period === value && styles.choiceOn]}>
                <Text style={[styles.choiceLabel, period === value && { color: colors.text }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Body muted>
            {period === 'month'
              ? `Different estates visited in ${monthName}, counting only check-ins made at the estate.`
              : 'Different estates ever visited.'}
          </Body>
          {rows.length <= 1 && <Body muted>Follow some friends to see how you compare.</Body>}
          {error && <ErrorText message={error} />}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item, index }) => (
        <View style={[styles.row, item.mine && styles.rowMine]}>
          <Text style={[styles.place, index === 0 && item.score > 0 && { color: colors.goldLight }]}>
            {index + 1}
          </Text>
          <Text style={styles.name}>{item.who}</Text>
          <Text style={styles.score}>{item.score}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: space.md,
  },
  rowMine: { borderColor: colors.gold },
  place: { width: 28, fontFamily: fonts.serif, fontSize: 22, color: colors.muted },
  name: { flex: 1, fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  score: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.goldLight },
});

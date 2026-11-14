import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, ErrorText, Eyebrow, Loading, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { addCheckin, fetchEstate, fetchMyCheckins, type Checkin, type Estate } from '@/lib/data';
import { AT_ESTATE_METRES, distanceMetres, formatDistance, getMyLocation, type Coords } from '@/lib/location';
import { colors, fonts, space } from '@/lib/theme';

export default function EstateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [estate, setEstate] = useState<Estate | null | undefined>(undefined);
  const [history, setHistory] = useState<Checkin[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [composing, setComposing] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [here, setHere] = useState<Coords | null>(null);

  const refresh = useCallback(() => {
    if (!userId || !id) return Promise.resolve();
    return Promise.all([fetchEstate(id), fetchMyCheckins(userId, id)])
      .then(([e, h]) => {
        setEstate(e);
        setHistory(h);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this estate.'));
  }, [id, userId]);

  useEffect(() => {
    refresh();
    getMyLocation()
      .then(setHere)
      .catch(() => setHere(null));
  }, [refresh]);

  if (estate === undefined && !error) return <Loading />;
  if (!estate) return <ErrorText message={error ?? 'Estate not found.'} />;

  const located = estate.latitude != null && estate.longitude != null;
  const distance =
    here && located ? distanceMetres(here, { latitude: estate.latitude!, longitude: estate.longitude! }) : null;
  const atEstate = distance != null && distance <= AT_ESTATE_METRES;

  async function save() {
    if (!userId || !estate) return;
    setSaving(true);
    setError(null);
    try {
      // Take a fresh reading at the moment of check-in.
      const pos = await getMyLocation().catch(() => null);
      await addCheckin({
        userId,
        estateId: estate.id,
        rating,
        note: note.trim() || null,
        latitude: pos?.latitude ?? null,
        longitude: pos?.longitude ?? null,
      });
      setComposing(false);
      setRating(null);
      setNote('');
      setSavedMsg(history.length === 0 ? 'First visit logged. Cheers!' : 'Visit logged. Cheers!');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your check-in.');
    } finally {
      setSaving(false);
    }
  }

  const tags = [
    estate.publicTasting === 'Y' && 'Tastings',
    estate.appointmentOnly === 'Y' && 'By appointment',
    estate.restaurant === 'Y' && 'Restaurant',
  ].filter(Boolean);

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Eyebrow>{estate.region}</Eyebrow>
        <Title>{estate.name}</Title>
        {tags.length > 0 && <Body muted>{tags.join(' · ')}</Body>}
        {distance != null && (
          <Body style={{ color: atEstate ? colors.success : colors.soft }}>
            {atEstate ? "You're here" : `${formatDistance(distance)} away`}
          </Body>
        )}

        {savedMsg && <Body style={{ color: colors.success }}>{savedMsg}</Body>}
        {savedMsg && history[0] && (
          <Button
            variant="outline"
            label="Share this visit"
            onPress={() => router.push({ pathname: '/share', params: { checkinId: history[0].id } })}
          />
        )}
        {error && <ErrorText message={error} />}

        {!composing ? (
          <Button label={history.length ? 'Log another visit' : 'Check in'} onPress={() => { setSavedMsg(null); setComposing(true); }} />
        ) : (
          <Card style={{ gap: space.sm }}>
            <Eyebrow>How was it?</Eyebrow>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(rating === n ? null : n)} hitSlop={8} accessibilityLabel={`${n} stars`}>
                  <Text style={[styles.star, rating != null && n <= rating && { color: colors.goldLight }]}>★</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Wines you loved, the view, the food…"
              placeholderTextColor={colors.muted}
              multiline
              style={styles.note}
            />
            {!atEstate && (
              <Body muted style={{ fontSize: 12 }}>
                {located
                  ? "You don't seem to be at the estate right now. Your visit will still be saved, but only visits checked in on the spot will count for leaderboards."
                  : "We don't have this estate's location yet, so this visit won't count for leaderboards."}
              </Body>
            )}
            <Button label="Save visit" onPress={save} loading={saving} />
            <Button variant="outline" label="Cancel" onPress={() => setComposing(false)} />
          </Card>
        )}

        <Eyebrow>Your visits here ({history.length})</Eyebrow>
        {history.length === 0 && <Body muted>Not visited yet.</Body>}
        {history.map((c) => (
          <Card key={c.id} style={{ gap: 4 }}>
            <Text style={styles.when}>
              {new Date(c.visited_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
              {c.rating ? `  ·  ${'★'.repeat(c.rating)}` : ''}
            </Text>
            {c.note && <Body>{c.note}</Body>}
            <Pressable onPress={() => router.push({ pathname: '/share', params: { checkinId: c.id } })} hitSlop={8}>
              <Text style={styles.shareLink}>Share</Text>
            </Pressable>
          </Card>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, gap: space.md },
  stars: { flexDirection: 'row', gap: space.sm },
  star: { fontSize: 30, color: colors.muted },
  note: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.sansLight,
    fontSize: 14,
    padding: space.sm,
    textAlignVertical: 'top',
  },
  when: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.goldLight },
  shareLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
});

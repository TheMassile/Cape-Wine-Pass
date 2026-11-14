import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, ErrorText, Eyebrow, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchEstates } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/lib/theme';

// Same rule as the website: lowercase letters, numbers and _ only, up to 20.
function cleanHandle(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

// First-time set-up after creating an account: handle, name, home region, age.
export default function WelcomeScreen() {
  const { session, refreshProfile } = useAuth();
  const alreadyConfirmedAdult = session?.user.user_metadata?.confirmed_adult === true;

  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [adult, setAdult] = useState(alreadyConfirmedAdult);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstates()
      .then((all) => setRegions([...new Set(all.map((e) => e.region))].sort()))
      .catch(() => setRegions([]));
  }, []);

  async function save() {
    if (!session) return;
    setError(null);
    const h = cleanHandle(handle);
    if (h.length < 3) {
      setError('Your handle needs at least 3 letters or numbers.');
      return;
    }
    if (!adult) {
      setError('Cape Wine Pass is for people aged 18 and over.');
      return;
    }
    setBusy(true);
    try {
      const { data: taken, error: checkErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('handle', h)
        .neq('user_id', session.user.id)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (taken) throw new Error('That handle is taken. Try another.');

      const row = {
        user_id: session.user.id,
        handle: h,
        display_name: name.trim() || null,
        home_region: region,
        confirmed_adult_at: new Date().toISOString(),
      };
      // Someone may already have a half-made profile from the website.
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      const { error: saveErr } = existing
        ? await supabase.from('profiles').update(row).eq('user_id', session.user.id)
        : await supabase.from('profiles').insert(row);
      if (saveErr) throw saveErr;
      await refreshProfile(); // moves on to the app
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Eyebrow>Welcome</Eyebrow>
          <Title>Set up your profile</Title>
          <Body muted>This is how friends will find you.</Body>

          <Card style={{ gap: space.xs, marginTop: space.md }}>
            <Eyebrow>Handle</Eyebrow>
            <TextInput
              value={handle}
              onChangeText={(t) => setHandle(cleanHandle(t))}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="e.g. capewinelover"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Eyebrow>Your name (optional)</Eyebrow>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholder="Shown on your profile"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            {regions.length > 0 && (
              <>
                <Eyebrow>Home region (optional)</Eyebrow>
                <View style={styles.chips}>
                  {regions.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setRegion(region === r ? null : r)}
                      style={[styles.chip, region === r && styles.chipOn]}>
                      <Text style={[styles.chipText, region === r && { color: colors.text }]}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {!alreadyConfirmedAdult && (
              <Pressable onPress={() => setAdult((a) => !a)} style={styles.check} hitSlop={6}>
                <View style={[styles.box, adult && styles.boxOn]}>
                  {adult && <Text style={styles.tick}>✓</Text>}
                </View>
                <Body style={{ flex: 1 }}>I&apos;m 18 or older</Body>
              </Pressable>
            )}

            {error && <ErrorText message={error} />}
            <View style={{ height: space.sm }} />
            <Button label="Start exploring" onPress={save} loading={busy} />
          </Card>

          <Button variant="outline" label="Sign out" onPress={() => supabase.auth.signOut()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, gap: space.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(44,36,32,0.6)',
    color: colors.text,
    fontFamily: fonts.sansLight,
    fontSize: 15,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    marginTop: space.xs,
    marginBottom: space.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.xs,
    marginBottom: space.md,
  },
  chip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.wine, borderColor: colors.wineLight },
  chipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.soft },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.wine, borderColor: colors.wineLight },
  tick: { color: colors.text, fontSize: 14 },
});

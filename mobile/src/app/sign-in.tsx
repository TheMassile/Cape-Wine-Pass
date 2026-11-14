import { useState } from 'react';
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

import { openPrivacyPolicy } from '@/lib/legal';

import { Body, Button, Card, ErrorText, Eyebrow, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [adult, setAdult] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function signUp() {
    setError(null);
    setNotice(null);
    if (!email.trim() || password.length < 8) {
      setError('Please enter your email and a password of at least 8 characters.');
      return;
    }
    if (!adult) {
      setError('Cape Wine Pass is for people aged 18 and over.');
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { confirmed_adult: true } },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is switched on: they need to tap the link first.
      setMode('signin');
      setNotice('Account created! Tap the link we emailed you, then come back and sign in.');
    }
    // With a session, the app moves on to profile set-up by itself.
  }

  async function signIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (err) setError(err.message);
    // On success the app switches to the main screens by itself.
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Body style={styles.brand}>Cape Wine Pass</Body>
          <Card style={styles.card}>
            <View style={styles.accent} />
            <Eyebrow>{mode === 'signin' ? 'Welcome back' : 'Join Cape Wine Pass'}</Eyebrow>
            <Title style={{ marginTop: space.sm, marginBottom: space.lg }}>
              {mode === 'signin' ? 'Sign in' : 'Create an account'}
            </Title>

            <Eyebrow>Email</Eyebrow>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Eyebrow>Password</Eyebrow>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder={mode === 'signin' ? 'Your password' : 'At least 8 characters'}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            {mode === 'signup' && (
              <Pressable onPress={() => setAdult((a) => !a)} style={styles.check} hitSlop={6}>
                <View style={[styles.box, adult && styles.boxOn]}>
                  {adult && <Text style={styles.tick}>✓</Text>}
                </View>
                <Body style={{ flex: 1 }}>I&apos;m 18 or older</Body>
              </Pressable>
            )}
            {mode === 'signup' && (
              <Text style={styles.legal}>
                By creating an account you agree to our{' '}
                <Text style={styles.legalLink} onPress={openPrivacyPolicy}>
                  privacy policy
                </Text>
                .
              </Text>
            )}

            {notice && <Body style={{ color: colors.success }}>{notice}</Body>}
            {error && <ErrorText message={error} />}
            <View style={{ height: space.md }} />
            <Button
              label={mode === 'signin' ? 'Sign in' : 'Create account'}
              onPress={mode === 'signin' ? signIn : signUp}
              loading={busy}
            />
          </Card>

          <Body muted style={styles.footer}>
            {mode === 'signin' ? 'New to Cape Wine Pass?' : 'Already have an account?'}
          </Body>
          <Button
            variant="outline"
            label={mode === 'signin' ? 'Create an account' : 'Sign in instead'}
            onPress={() => {
              setError(null);
              setMode(mode === 'signin' ? 'signup' : 'signin');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, gap: space.md, flexGrow: 1, justifyContent: 'center' },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.goldLight,
    marginBottom: space.md,
  },
  card: { padding: space.lg, gap: space.xs },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.wine },
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
  footer: { textAlign: 'center', marginTop: space.lg },
  legal: {
    fontFamily: fonts.sansLight,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: space.sm,
  },
  legalLink: { color: colors.goldLight, textDecorationLine: 'underline' },
});

import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, ErrorText, Eyebrow, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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
            <Eyebrow>Welcome back</Eyebrow>
            <Title style={{ marginTop: space.sm, marginBottom: space.lg }}>Sign in</Title>

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
              autoComplete="current-password"
              placeholder="Your password"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            {error && <ErrorText message={error} />}
            <View style={{ height: space.md }} />
            <Button label="Sign in" onPress={signIn} loading={busy} />
          </Card>

          <Body muted style={styles.footer}>
            New to Cape Wine Pass? For now, create your account on the website, then sign in here.
          </Body>
          <Button
            variant="outline"
            label="Create an account"
            onPress={() => WebBrowser.openBrowserAsync('https://capewinepass.co.za/login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, gap: space.md, flexGrow: 1, justifyContent: 'center' },
  brand: { fontFamily: fonts.serif, fontSize: 20, letterSpacing: 2, color: colors.goldLight, marginBottom: space.md },
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
  footer: { textAlign: 'center', marginTop: space.lg },
});

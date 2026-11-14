import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  useFonts as useSerif,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  useFonts as useSans,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { colors, fonts } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, text: colors.text, primary: colors.gold, border: colors.border },
};

function RootStack() {
  const { session, loading } = useAuth();
  const [serifLoaded] = useSerif({ CormorantGaramond_300Light, CormorantGaramond_400Regular });
  const [sansLoaded] = useSans({ Montserrat_300Light, Montserrat_400Regular, Montserrat_500Medium });
  const ready = !loading && serifLoaded && sansLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.goldLight,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      {/* Signed in: the app. Signed out: only the sign-in screen. */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="region/[region]" options={{ title: '' }} />
        <Stack.Screen name="estate/[id]" options={{ title: '' }} />
        <Stack.Screen name="share" options={{ title: 'Share your visit', presentation: 'modal' }} />
        <Stack.Screen name="badges" options={{ title: 'Badges' }} />
        <Stack.Screen name="people" options={{ title: 'People' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, space } from '@/lib/theme';

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  loading,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonOutline,
        (pressed || loading) && { opacity: 0.7 },
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.buttonLabel, !primary && { color: colors.goldLight }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return <Text style={[styles.body, { color: colors.danger }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serifLight, fontSize: 32, color: colors.text },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  body: { fontFamily: fonts.sansLight, fontSize: 14, lineHeight: 22, color: colors.soft },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: space.md,
  },
  button: { paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  buttonPrimary: { backgroundColor: colors.wine, borderColor: colors.wineLight },
  buttonOutline: { backgroundColor: 'transparent', borderColor: colors.border },
  buttonLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.text,
  },
  track: { height: 2, backgroundColor: 'rgba(184,150,90,0.15)' },
  fill: { height: 2, backgroundColor: colors.gold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});

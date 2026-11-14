import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui';
import type { Badge } from '@/lib/badges';
import { colors, fonts, space } from '@/lib/theme';

export function BadgeTile({ badge }: { badge: Badge }) {
  const { have, need } = badge.progress;
  return (
    <View style={[styles.tile, badge.earned && styles.earned]}>
      <View style={[styles.medal, badge.earned && styles.medalEarned]}>
        <Text style={[styles.medalText, badge.earned && { color: colors.background }]}>
          {badge.earned ? '★' : `${Math.round((have / need) * 100)}%`}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.label, !badge.earned && { color: colors.soft }]}>{badge.label}</Text>
        <Text style={styles.desc}>{badge.desc}</Text>
        {!badge.earned && (
          <View style={{ gap: 4, marginTop: 4 }}>
            <ProgressBar value={have / need} />
            <Text style={styles.desc}>
              {have} of {need}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: space.md,
  },
  earned: { borderColor: 'rgba(212,174,122,0.5)' },
  medal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalEarned: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  medalText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
  label: { fontFamily: fonts.serif, fontSize: 19, color: colors.text },
  desc: { fontFamily: fonts.sansLight, fontSize: 12, color: colors.muted },
});

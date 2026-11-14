import { SectionList, StyleSheet, View } from 'react-native';

import { BadgeTile } from '@/components/BadgeTile';
import { ErrorText, Eyebrow, Loading } from '@/components/ui';
import { colors, space } from '@/lib/theme';
import { useJourney } from '@/lib/useJourney';

// Every badge, grouped: visit milestones, explorer badges, then one per region.
export default function BadgesScreen() {
  const { summary, error } = useJourney();
  if (!summary && !error) return <Loading />;
  if (!summary) return <View style={styles.pad}><ErrorText message={error ?? 'Something went wrong.'} /></View>;

  const sections = [
    { title: 'Estates visited', data: summary.badges.filter((b) => b.id.startsWith('visits-')) },
    {
      title: 'Explorer',
      data: summary.badges.filter((b) => !b.id.startsWith('visits-') && !b.id.startsWith('region-')),
    },
    { title: 'Regions', data: summary.badges.filter((b) => b.id.startsWith('region-')) },
  ];

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.pad}
      sections={sections}
      keyExtractor={(b) => b.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.header}>
          <Eyebrow>{section.title}</Eyebrow>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item }) => <BadgeTile badge={item} />}
    />
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg },
  header: { paddingTop: space.md, paddingBottom: space.sm },
});

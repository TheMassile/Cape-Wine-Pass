import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.card}
      labelStyle={{ default: { color: colors.muted }, selected: { color: colors.goldLight } }}
      iconColor={{ default: colors.muted, selected: colors.goldLight }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wineglass" md="wine_bar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nearby">
        <NativeTabs.Trigger.Label>Near me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="location" md="near_me" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

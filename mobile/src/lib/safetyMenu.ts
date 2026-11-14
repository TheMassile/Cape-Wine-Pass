import { Alert } from 'react-native';

import { blockUser, reportContent } from './social';

// The "⋯" menu on someone else's post: report it, or block the person.
export function openSafetyMenu(opts: {
  userId: string;
  name: string;
  checkinId?: string;
  onBlocked: () => void;
}) {
  const report = (reason: string) =>
    reportContent({ reportedUserId: opts.userId, checkinId: opts.checkinId, reason })
      .then(() => Alert.alert('Thanks for letting us know', "We'll take a look."))
      .catch((e) => Alert.alert('Could not send report', e instanceof Error ? e.message : ''));

  Alert.alert(opts.name, undefined, [
    {
      text: 'Report',
      onPress: () =>
        Alert.alert('What is wrong with it?', undefined, [
          { text: 'Spam or fake', onPress: () => report('Spam or fake') },
          { text: 'Offensive or inappropriate', onPress: () => report('Offensive or inappropriate') },
          { text: 'Cancel', style: 'cancel' },
        ]),
    },
    {
      text: 'Block',
      style: 'destructive',
      onPress: () =>
        Alert.alert(
          `Block ${opts.name}?`,
          "You won't see each other's visits or profiles, and any follows between you are removed.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () =>
                blockUser(opts.userId)
                  .then(opts.onBlocked)
                  .catch((e) => Alert.alert('Could not block', e instanceof Error ? e.message : '')),
            },
          ],
        ),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

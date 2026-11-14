import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useAuth } from './auth';
import { computeBadges, getRank } from './badges';
import { fetchEstates, fetchMyCheckins, fetchVisitedIds, type Checkin, type Estate } from './data';

type Loaded = { estates: Estate[]; visited: Set<string>; checkins: Checkin[] };

// Everything the badges need: open estates, what you've visited, and your check-ins.
export function useJourney() {
  const { session } = useAuth();
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (): Promise<Loaded> => {
    if (!session) return { estates: [], visited: new Set(), checkins: [] };
    const [estates, visited, checkins] = await Promise.all([
      fetchEstates(),
      fetchVisitedIds(session.user.id),
      fetchMyCheckins(session.user.id),
    ]);
    return { estates, visited, checkins };
  }, [session]);

  const show = useCallback(
    (p: Promise<Loaded>) =>
      p
        .then((d) => {
          setError(null);
          setData(d);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your badges.')),
    [],
  );

  const reload = useCallback(() => show(fetchAll()), [show, fetchAll]);

  // Load whenever the screen comes into view, so a new check-in shows straight away.
  useFocusEffect(
    useCallback(() => {
      show(fetchAll());
    }, [show, fetchAll]),
  );

  const summary = useMemo(() => {
    if (!data) return null;
    const openIds = new Set(data.estates.map((e) => e.id));
    const visitedCount = [...data.visited].filter((id) => openIds.has(id)).length;
    const total = data.estates.length;
    const badges = computeBadges(data.estates, data.visited, data.checkins);
    return {
      visitedCount,
      total,
      checkinCount: data.checkins.length,
      rank: getRank(visitedCount, total),
      badges,
      earned: badges.filter((b) => b.earned),
      // The three locked badges you're closest to.
      nextUp: badges
        .filter((b) => !b.earned)
        .sort((a, b) => b.progress.have / b.progress.need - a.progress.have / a.progress.need)
        .slice(0, 3),
    };
  }, [data]);

  return { summary, error, reload };
}

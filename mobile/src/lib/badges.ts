// Badges and rank, worked out on the phone from your visits and check-ins.
// The milestone names and ranks match the website's Badges page.
import type { Checkin, Estate } from './data';

export type Rank = 'Explorer' | 'Bronze' | 'Silver' | 'Gold' | 'Elite';

export type Badge = {
  id: string;
  label: string;
  desc: string;
  earned: boolean;
  // How far along you are, for badges not yet earned (e.g. 3 of 5).
  progress: { have: number; need: number };
};

const MILESTONES = [
  { count: 1, label: 'First Pour', desc: 'Your wine journey begins.' },
  { count: 5, label: 'Getting the Taste', desc: 'Five estates explored.' },
  { count: 10, label: 'Wine Wanderer', desc: 'Bronze rank unlocked.' },
  { count: 25, label: 'Cape Explorer', desc: 'A quarter century of visits.' },
  { count: 50, label: 'Silver Palate', desc: 'Silver rank unlocked.' },
  { count: 100, label: 'Connoisseur', desc: 'Gold rank unlocked.' },
  { count: 200, label: 'Grand Cru', desc: 'An extraordinary dedication.' },
  { count: 300, label: 'Master of the Cape', desc: 'Legendary status.' },
];

export function getRank(visited: number, total: number): Rank {
  if (total > 0 && visited >= total) return 'Elite';
  if (visited >= 100) return 'Gold';
  if (visited >= 50) return 'Silver';
  if (visited >= 10) return 'Bronze';
  return 'Explorer';
}

export const RANK_COLOURS: Record<Rank, string> = {
  Explorer: '#8C8070',
  Bronze: '#B8965A',
  Silver: '#B8AFA0',
  Gold: '#D4AE7A',
  Elite: '#D4AE7A',
};

// "Silver at 50 visits — 12 to go"
export function nextRankText(visited: number, total: number): string {
  const rank = getRank(visited, total);
  if (rank === 'Explorer') return `Bronze at 10 visits, ${10 - visited} to go`;
  if (rank === 'Bronze') return `Silver at 50 visits, ${50 - visited} to go`;
  if (rank === 'Silver') return `Gold at 100 visits, ${100 - visited} to go`;
  if (rank === 'Gold') return `Elite by visiting every estate, ${total - visited} to go`;
  return 'Elite: every estate visited';
}

function badge(id: string, label: string, desc: string, have: number, need: number): Badge {
  return { id, label, desc, earned: have >= need, progress: { have: Math.min(have, need), need } };
}

export type RegionProgress = { name: string; total: number; visited: number };

export function regionProgress(estates: Estate[], visited: Set<string>): RegionProgress[] {
  const map = new Map<string, RegionProgress>();
  for (const e of estates) {
    const row = map.get(e.region) ?? { name: e.region, total: 0, visited: 0 };
    row.total += 1;
    if (visited.has(e.id)) row.visited += 1;
    map.set(e.region, row);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function computeBadges(estates: Estate[], visited: Set<string>, checkins: Checkin[]): Badge[] {
  const openIds = new Set(estates.map((e) => e.id));
  const visitedCount = [...visited].filter((id) => openIds.has(id)).length;
  const regions = regionProgress(estates, visited);
  const regionsStarted = regions.filter((r) => r.visited > 0).length;

  // Most check-ins at any one estate, and how many check-ins have a star rating.
  const perEstate = new Map<string, number>();
  for (const c of checkins) perEstate.set(c.estate_id, (perEstate.get(c.estate_id) ?? 0) + 1);
  const mostAtOne = Math.max(0, ...perEstate.values());
  const rated = checkins.filter((c) => c.rating != null).length;

  const list: Badge[] = MILESTONES.map((m) =>
    badge(`visits-${m.count}`, m.label, m.desc, visitedCount, m.count),
  );

  list.push(
    badge('regions-3', 'Region Hopper', 'Visit estates in 3 different regions.', regionsStarted, 3),
    badge('regions-all', 'All Over the Cape', 'Visit at least one estate in every region.', regionsStarted, regions.length || 1),
    badge('return-2', 'Back for More', 'Check in at the same estate twice.', mostAtOne, 2),
    badge('return-5', 'Regular', 'Check in at the same estate 5 times.', mostAtOne, 5),
    badge('rated-10', 'The Critic', 'Rate 10 visits with stars.', rated, 10),
  );

  // One badge per region for visiting every estate in it.
  for (const r of regions) {
    list.push(badge(`region-${r.name}`, `${r.name} Complete`, `Visit every estate in ${r.name}.`, r.visited, r.total));
  }

  return list;
}

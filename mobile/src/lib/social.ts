// Following, the feed and cheers. The database rules decide who can see what;
// see supabase/migrations/20261114030000_follows_feed_cheers.sql.
import { fetchEstates } from './data';
import { supabase } from './supabase';
import { favouritesLine } from './wines';

export type Person = { user_id: string; handle: string | null; display_name: string | null };
export type Visibility = 'public' | 'friends' | 'private';

export type Follow = { follower_id: string; followee_id: string; status: 'pending' | 'accepted' };

export function personName(p: Person | undefined | null): string {
  if (!p) return 'Someone';
  return p.display_name || (p.handle ? `@${p.handle}` : 'Someone');
}

export async function fetchPeople(ids: string[]): Promise<Map<string, Person>> {
  const map = new Map<string, Person>();
  if (ids.length === 0) return map;
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, handle, display_name')
    .in('user_id', ids);
  if (error) throw error;
  for (const p of (data ?? []) as Person[]) map.set(p.user_id, p);
  return map;
}

export async function searchPeople(query: string, myId: string): Promise<Person[]> {
  const q = query.trim().replace(/[%,()]/g, '');
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, handle, display_name')
    .or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq('user_id', myId)
    .limit(25);
  if (error) throw error;
  return (data ?? []) as Person[];
}

// Every follow you're part of: people you follow, and people following you.
export async function fetchMyFollows(myId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, followee_id, status')
    .or(`follower_id.eq.${myId},followee_id.eq.${myId}`);
  if (error) throw error;
  const rows = (data ?? []) as Follow[];
  return {
    following: rows.filter((r) => r.follower_id === myId),
    followers: rows.filter((r) => r.followee_id === myId && r.status === 'accepted'),
    requests: rows.filter((r) => r.followee_id === myId && r.status === 'pending'),
  };
}

export async function follow(myId: string, targetId: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: myId, followee_id: targetId });
  if (error) throw error;
}

// Unfollow someone, or cancel a request you sent.
export async function unfollow(myId: string, targetId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', myId)
    .eq('followee_id', targetId);
  if (error) throw error;
}

export async function approveRequest(myId: string, followerId: string) {
  const { error } = await supabase
    .from('follows')
    .update({ status: 'accepted' })
    .eq('follower_id', followerId)
    .eq('followee_id', myId);
  if (error) throw error;
}

// Decline a request, or remove someone who follows you.
export async function removeFollower(myId: string, followerId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followee_id', myId);
  if (error) throw error;
}

export async function fetchMyVisibility(myId: string): Promise<Visibility> {
  const { data, error } = await supabase
    .from('profiles')
    .select('visibility')
    .eq('user_id', myId)
    .maybeSingle();
  if (error) throw error;
  return (data?.visibility as Visibility | undefined) ?? 'public';
}

export async function setMyVisibility(myId: string, visibility: Visibility) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ visibility })
    .eq('user_id', myId)
    .select('user_id');
  if (error) throw error;
  if (!data?.length) throw new Error('Set up your profile on the website first (choose a handle).');
}

export type FeedItem = {
  id: string;
  userId: string;
  who: string;
  estateId: string;
  estateName: string;
  region: string;
  visitedAt: string;
  rating: number | null;
  note: string | null;
  verified: boolean;
  favourites: string;
  cheers: number;
  cheeredByMe: boolean;
  mine: boolean;
};

// Recent check-ins from you and the people you follow (approved follows only).
export async function fetchFeed(myId: string): Promise<FeedItem[]> {
  const { following } = await fetchMyFollows(myId);
  const ids = [myId, ...following.filter((f) => f.status === 'accepted').map((f) => f.followee_id)];

  const { data, error } = await supabase
    .from('checkins')
    .select(
      'id, user_id, estate_id, visited_at, rating, note, verified, fav_red, fav_white, fav_rose, cheers(user_id)',
    )
    .in('user_id', ids)
    .neq('source', 'import')
    .order('visited_at', { ascending: false })
    .limit(60);
  if (error) throw error;

  type Row = {
    id: string;
    user_id: string;
    estate_id: string;
    visited_at: string;
    rating: number | null;
    note: string | null;
    verified: boolean;
    fav_red: string | null;
    fav_white: string | null;
    fav_rose: string | null;
    cheers: { user_id: string }[] | null;
  };
  const rows = (data ?? []) as Row[];
  const [people, estates] = await Promise.all([
    fetchPeople([...new Set(rows.map((r) => r.user_id))]),
    fetchEstates(),
  ]);
  const estateById = new Map(estates.map((e) => [e.id, e]));

  return rows.map((r) => {
    const estate = estateById.get(r.estate_id);
    const cheers = r.cheers ?? [];
    return {
      id: r.id,
      userId: r.user_id,
      who: r.user_id === myId ? 'You' : personName(people.get(r.user_id)),
      estateId: r.estate_id,
      estateName: estate?.name ?? 'an estate',
      region: estate?.region ?? '',
      visitedAt: r.visited_at,
      rating: r.rating,
      note: r.note,
      verified: r.verified,
      favourites: favouritesLine(r),
      cheers: cheers.length,
      cheeredByMe: cheers.some((c) => c.user_id === myId),
      mine: r.user_id === myId,
    };
  });
}

export async function cheer(myId: string, checkinId: string) {
  const { error } = await supabase.from('cheers').insert({ checkin_id: checkinId, user_id: myId });
  if (error) throw error;
}

export async function uncheer(myId: string, checkinId: string) {
  const { error } = await supabase.from('cheers').delete().eq('checkin_id', checkinId).eq('user_id', myId);
  if (error) throw error;
}

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export type LeaderRow = { userId: string; who: string; score: number; mine: boolean };
export type Leaderboards = { month: LeaderRow[]; allTime: LeaderRow[] };

// You and the people you follow, ranked two ways:
//   month:   different estates with a GPS-verified check-in this calendar month
//   allTime: different estates ever checked in at
export async function fetchLeaderboards(myId: string): Promise<Leaderboards> {
  const { following } = await fetchMyFollows(myId);
  const ids = [myId, ...following.filter((f) => f.status === 'accepted').map((f) => f.followee_id)];

  const { data, error } = await supabase
    .from('checkins')
    .select('user_id, estate_id, verified, visited_at')
    .in('user_id', ids);
  if (error) throw error;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const month = new Map<string, Set<string>>();
  const allTime = new Map<string, Set<string>>();
  for (const id of ids) {
    month.set(id, new Set());
    allTime.set(id, new Set());
  }
  for (const r of (data ?? []) as {
    user_id: string;
    estate_id: string;
    verified: boolean;
    visited_at: string;
  }[]) {
    allTime.get(r.user_id)?.add(r.estate_id);
    if (r.verified && new Date(r.visited_at) >= monthStart) month.get(r.user_id)?.add(r.estate_id);
  }

  const people = await fetchPeople(ids);
  const rank = (m: Map<string, Set<string>>): LeaderRow[] =>
    // Leave out people whose visits we can't see (e.g. they went private).
    ids
      .filter((id) => id === myId || (allTime.get(id)?.size ?? 0) > 0)
      .map((id) => ({
        userId: id,
        who: id === myId ? 'You' : personName(people.get(id)),
        score: m.get(id)?.size ?? 0,
        mine: id === myId,
      }))
      .sort((a, b) => b.score - a.score || a.who.localeCompare(b.who));

  return { month: rank(month), allTime: rank(allTime) };
}

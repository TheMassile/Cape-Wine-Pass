import { supabase } from './supabase';

export type Estate = {
  id: string;
  name: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  publicTasting: string | null;
  appointmentOnly: string | null;
  restaurant: string | null;
};

// The estates table uses column names with spaces ("Estate ID"); map them to simple names once, here.
export async function fetchEstates(): Promise<Estate[]> {
  const { data, error } = await supabase
    .from('estates')
    .select(
      '"Estate ID","Estate Name","Region","Status","Public Tasting (Y/N)","Appointment Only (Y/N)","Restaurant (Y/N)",latitude,longitude',
    );
  if (error) throw error;
  return (data ?? [])
    .filter((r: Record<string, unknown>) => r['Status'] !== 'Closed')
    .map((r: Record<string, unknown>) => ({
      id: String(r['Estate ID']),
      name: String(r['Estate Name']),
      region: String(r['Region']),
      latitude: (r['latitude'] as number | null) ?? null,
      longitude: (r['longitude'] as number | null) ?? null,
      publicTasting: (r['Public Tasting (Y/N)'] as string | null) ?? null,
      appointmentOnly: (r['Appointment Only (Y/N)'] as string | null) ?? null,
      restaurant: (r['Restaurant (Y/N)'] as string | null) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchVisitedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('visits').select('estate_id').eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => String(r.estate_id)));
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('handle, display_name, home_region')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as { handle: string | null; display_name: string | null; home_region: string | null } | null;
}

export type Checkin = {
  id: string;
  estate_id: string;
  visited_at: string;
  rating: number | null;
  note: string | null;
  verified: boolean;
  fav_red: string | null;
  fav_white: string | null;
  fav_rose: string | null;
};

export async function fetchEstate(id: string): Promise<Estate | null> {
  const all = await fetchEstates();
  return all.find((e) => e.id === id) ?? null;
}

export async function fetchMyCheckins(userId: string, estateId?: string): Promise<Checkin[]> {
  let q = supabase
    .from('checkins')
    .select('id, estate_id, visited_at, rating, note, verified, fav_red, fav_white, fav_rose')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false });
  if (estateId) q = q.eq('estate_id', estateId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Checkin[];
}

export async function addCheckin(input: {
  userId: string;
  estateId: string;
  rating: number | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  favourites?: { fav_red: string | null; fav_white: string | null; fav_rose: string | null };
}) {
  const { error } = await supabase.from('checkins').insert({
    user_id: input.userId,
    estate_id: input.estateId,
    rating: input.rating,
    note: input.note,
    latitude: input.latitude,
    longitude: input.longitude,
    source: 'app',
    ...input.favourites,
  });
  if (error) throw error;
}

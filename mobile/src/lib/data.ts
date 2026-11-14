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
    .select('"Estate ID","Estate Name","Region","Status","Public Tasting (Y/N)","Appointment Only (Y/N)","Restaurant (Y/N)",latitude,longitude');
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

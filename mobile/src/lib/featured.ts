// Paid "Wine farm of the week" / "Red of the region" spots. The database only
// returns spots running today (see supabase/migrations/20261114050000_featured_slots.sql).
import { supabase } from './supabase';

export type FeaturedSpot = {
  id: string;
  slot: 'farm_of_week' | 'red_of_region';
  estateId: string;
  region: string | null;
  wineName: string | null;
  blurb: string | null;
  linkUrl: string | null;
};

export async function fetchFeatured(): Promise<FeaturedSpot[]> {
  const { data, error } = await supabase
    .from('featured')
    .select('id, slot, estate_id, region, wine_name, blurb, link_url')
    .order('slot')
    .order('starts_on', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    slot: r.slot as FeaturedSpot['slot'],
    estateId: r.estate_id as string,
    region: (r.region as string | null) ?? null,
    wineName: (r.wine_name as string | null) ?? null,
    blurb: (r.blurb as string | null) ?? null,
    linkUrl: (r.link_url as string | null) ?? null,
  }));
}

// Favourite wines. Each estate has a shared list of wines that grows as people add them;
// see supabase/migrations/20261114070000_estate_wines.sql.
import { supabase } from './supabase';

export type WineColour = 'red' | 'white' | 'rose_other';

export const WINE_COLOURS: { key: WineColour; label: string; field: 'fav_red' | 'fav_white' | 'fav_rose' }[] =
  [
    { key: 'red', label: 'Favourite red', field: 'fav_red' },
    { key: 'white', label: 'Favourite white', field: 'fav_white' },
    { key: 'rose_other', label: 'Favourite rosé or other', field: 'fav_rose' },
  ];

export type FavWines = { fav_red: string | null; fav_white: string | null; fav_rose: string | null };
export const NO_FAVS: FavWines = { fav_red: null, fav_white: null, fav_rose: null };

export type WineList = Record<WineColour, string[]>;

export async function fetchWineList(estateId: string): Promise<WineList> {
  const { data, error } = await supabase
    .from('wines')
    .select('colour, name')
    .eq('estate_id', estateId)
    .order('name');
  if (error) throw error;
  const list: WineList = { red: [], white: [], rose_other: [] };
  for (const w of (data ?? []) as { colour: WineColour; name: string }[]) list[w.colour]?.push(w.name);
  return list;
}

// Your current favourites for an estate (the same ones the website shows).
export async function fetchMyFavourites(userId: string, estateId: string): Promise<FavWines> {
  const { data, error } = await supabase
    .from('visits')
    .select('favorite_red, favorite_white, favorite_rose')
    .eq('user_id', userId)
    .eq('estate_id', estateId)
    .maybeSingle();
  if (error) throw error;
  return {
    fav_red: data?.favorite_red || null,
    fav_white: data?.favorite_white || null,
    fav_rose: data?.favorite_rose || null,
  };
}

// Add a wine to the estate's shared list. Already there (any capitals) is fine.
export async function addWine(estateId: string, colour: WineColour, name: string) {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 2) throw new Error('Wine name is too short.');
  const { error } = await supabase.from('wines').insert({ estate_id: estateId, colour, name: clean });
  if (error && error.code !== '23505') throw error;
  return clean;
}

// "🍷 Pinotage 2021 · 🥂 Chenin Blanc" for the feed and share cards.
export function favouritesLine(f: Partial<FavWines>): string {
  return [
    f.fav_red && `🍷 ${f.fav_red}`,
    f.fav_white && `🥂 ${f.fav_white}`,
    f.fav_rose && `🌸 ${f.fav_rose}`,
  ]
    .filter(Boolean)
    .join('   ');
}

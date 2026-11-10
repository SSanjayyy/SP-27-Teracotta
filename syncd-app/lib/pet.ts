import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ensureConfigured } from '@/lib/playlists';
import { isDemoMode } from '@/lib/mockData';
import type { SpotifySong } from '@/lib/spotify';

// The pet, the daily check-in, the streak and My Week, for the screens.
// Same rules as lib/playlists.ts: every function throws an Error with a readable message, so wrap
// calls in try/catch and show err.message. The database only lets the app READ pet data; every
// change goes through the functions in supabase/migrations/20261110000000_pet_companion.sql, so
// nobody can give themselves a grown pet or a 100-day streak.
//
// This is a companion, not a game (Spotify policy): no points, levels or scores. The pet grows up
// (egg -> baby -> grown) and "growth" is just the number of days you've checked in together.

// ---- Rules (keep in step with pet_rules() in the migration) ---------------------------------

export const PET_RULES = {
  /** Days together (check-ins) to hatch from egg to baby. */
  babyAt: 3,
  /** Days together to grow from baby to grown. */
  grownAt: 14,
  /** Every 7 days of streak earns an automatic skip day... */
  skipDayEvery: 7,
  /** ...and you can hold at most 2. */
  maxSkipDays: 2,
  /** Days together that unlock each keepsake. */
  keepsakes: { week_together: 7, two_weeks_together: 14, month_together: 30 },
} as const;

export type PetStage = 'egg' | 'baby' | 'grown';

/** The five moods the user picks from at check-in. The pet mirrors the one picked. */
export const MOODS = ['joyful', 'calm', 'sleepy', 'fired_up', 'thoughtful'] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABELS: Record<Mood, string> = {
  joyful: 'Joyful',
  calm: 'Calm',
  sleepy: 'Sleepy',
  fired_up: 'Fired up',
  thoughtful: 'Thoughtful',
};

export type KeepsakeKey = keyof typeof PET_RULES.keepsakes;

// ---- Genre -> color (keep in step with genre_key_for / color_key_for_genre in the migration
//      and supabase/functions/_shared/genres.ts) ----------------------------------------------

export type GenreKey =
  | 'hip-hop' | 'pop' | 'rock' | 'r&b' | 'jazz' | 'electronic'
  | 'latin' | 'country' | 'classical' | 'indie' | 'other';

export type ColorKey = 'pink' | 'gold' | 'red' | 'purple' | 'blue' | 'green';

export const COLOR_FOR_GENRE: Record<GenreKey, ColorKey> = {
  pop: 'pink',
  latin: 'pink',
  'hip-hop': 'gold',
  country: 'gold',
  rock: 'red',
  'r&b': 'purple',
  jazz: 'purple',
  electronic: 'blue',
  classical: 'blue',
  indie: 'green',
  other: 'green',
};

/**
 * The 6 pet colors. PLACEHOLDER hex values: swap in Donalthea's final genre colors here (the
 * keys stay the same, so nothing else changes).
 */
export const PET_COLORS: Record<ColorKey, { main: string; light: string; label: string }> = {
  pink: { main: '#F27BB0', light: '#FBD3E5', label: 'Pop & Latin' },
  gold: { main: '#F2B441', light: '#FBE5BA', label: 'Hip-Hop & Country' },
  red: { main: '#E3604F', light: '#F7C9C2', label: 'Rock' },
  purple: { main: '#9C6ADE', light: '#DCCBF5', label: 'R&B, Soul & Jazz' },
  blue: { main: '#4BA3E3', light: '#C6E2F7', label: 'Electronic & Classical' },
  green: { main: '#5DBB7A', light: '#CBEBD5', label: 'Indie & Everything else' },
};

export const GENRE_LABELS: Record<GenreKey, string> = {
  'hip-hop': 'Hip-Hop',
  pop: 'Pop',
  rock: 'Rock',
  'r&b': 'R&B / Soul',
  jazz: 'Jazz',
  electronic: 'Electronic',
  latin: 'Latin',
  country: 'Country',
  classical: 'Classical',
  indie: 'Indie',
  other: 'Other',
};

const GENRE_RULES: [RegExp, GenreKey][] = [
  [/(hip.?hop|\brap|trap\b|drill|grime)/, 'hip-hop'],
  [/(r&b|\brnb\b|\br ?n ?b\b|soul|funk|motown)/, 'r&b'],
  [/(latin|reggaeton|salsa|bachata|cumbia|banda|corrido|urbano|samba|bossa)/, 'latin'],
  [/(country|bluegrass|americana)/, 'country'],
  [/(jazz|swing|bebop)/, 'jazz'],
  [/(classical|orchestra|baroque|opera|symphon|soundtrack)/, 'classical'],
  [/(indie|alternative|\balt[ -]|lo.?fi|bedroom)/, 'indie'],
  [/(rock|metal|punk|grunge|\bemo\b|hardcore)/, 'rock'],
  [/(edm|house|techno|electro|trance|dubstep|drum and bass|\bdnb\b|ambient|synth)/, 'electronic'],
  [/pop/, 'pop'],
  [/(dance|disco)/, 'electronic'],
];

/** Any genre text ("atl hip hop", "R&B") -> one of our genre keys. Unknown or blank -> 'other'. */
export function genreKeyFor(genre: string | null | undefined): GenreKey {
  const g = (genre ?? '').trim().toLowerCase();
  if (!g) return 'other';
  for (const [pattern, key] of GENRE_RULES) if (pattern.test(g)) return key;
  return 'other';
}

export function colorKeyForGenre(genre: string | null | undefined): ColorKey {
  return COLOR_FOR_GENRE[genreKeyFor(genre)];
}

// ---- Shapes the screens get ------------------------------------------------------------------

export type Pet = {
  id: number;
  name: string;
  stage: PetStage;
  /** The mood picked at the last check-in, or 'sleepy' after a missed day. */
  mood: Mood;
  /** Days missed since the last check-in (0 if checked in today or yesterday). */
  missedDays: number;
  colorKey: ColorKey;
  genreKey: GenreKey;
  /** Days together (real check-ins). */
  growth: number;
  adoptedAt: string;
  accessories: string[];
  checkedInToday: boolean;
  /** Days together needed for the next stage, or null once grown. */
  nextStageAt: number | null;
};

export type Streak = {
  /** 0 once the streak can't be saved any more. */
  current: number;
  longest: number;
  lastCheckInDate: string | null;
  skipDaysAvailable: number;
  /** Yesterday was missed, but a skip day will cover it at the next check-in. */
  skipDayPending: boolean;
};

export type PetState = { pet: Pet; streak: Streak };

export type CheckInResult = PetState & {
  /** True if today was already checked in; nothing changed. */
  alreadyCheckedIn: boolean;
  /** A skip day covered yesterday ("Your skip day kept your streak going!"). */
  usedSkipDay: boolean;
  /** The streak started again at 1 after a gap. Keep the message kind. */
  streakReset: boolean;
  /** The pet just hatched or grew up. */
  stageChanged: boolean;
  /** Keepsakes unlocked by this check-in, e.g. ['week_together']. */
  newKeepsakes: KeepsakeKey[];
};

export type CheckIn = {
  id: number;
  date: string;
  /** Song fields are null on skip days, after disconnecting Spotify, or after 8 weeks. */
  spotifyTrackId: string | null;
  trackName: string | null;
  artistName: string | null;
  albumArtUrl: string | null;
  genre: GenreKey | null;
  mood: Mood | null;
  note: string | null;
  wasSkipDay: boolean;
};

export type Keepsake = { key: KeepsakeKey; unlockedAt: string };

export type DailySummary = {
  date: string;
  trackCount: number;
  topGenre: GenreKey | null;
  topArtist: string | null;
};

// ---- Helpers ---------------------------------------------------------------------------------

/** Today's date on this phone as YYYY-MM-DD (the server uses it so days match the user's day). */
export function todayLocal(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD for `days` days before the given YYYY-MM-DD (or today). */
export function daysBefore(days: number, from = todayLocal()): string {
  const [y, m, d] = from.split('-').map(Number);
  return todayLocal(new Date(y, m - 1, d - days));
}

// The database functions raise friendly messages ("Adopt your pet first."), so show those as-is.
function petFail(action: string, error: { message: string; code?: string }): never {
  const friendly = ['22023', 'P0002', '23505', '28000'];
  if (error.code && friendly.includes(error.code)) throw new Error(error.message);
  throw new Error(`Couldn't ${action}: ${error.message}`);
}

function toPetState(raw: any): PetState {
  const p = raw.pet;
  const s = raw.streak;
  return {
    pet: {
      id: p.id,
      name: p.name,
      stage: p.stage,
      mood: p.mood,
      missedDays: p.missed_days ?? 0,
      colorKey: p.color_key,
      genreKey: p.genre_key,
      growth: p.growth,
      adoptedAt: p.adopted_at,
      accessories: Array.isArray(p.accessories) ? p.accessories : [],
      checkedInToday: !!p.checked_in_today,
      nextStageAt: p.next_stage_at ?? null,
    },
    streak: {
      current: s.current,
      longest: s.longest,
      lastCheckInDate: s.last_check_in_date ?? null,
      skipDaysAvailable: s.skip_days_available,
      skipDayPending: !!s.skip_day_pending,
    },
  };
}

// Demo mode with no Supabase keys: the pet lives in memory (see lib/mockData.ts).
const useLocalDemo = () => !isSupabaseConfigured && isDemoMode;
const demo = {
  state: null as PetState | null,
  checkIns: [] as CheckIn[],
  keepsakes: [] as Keepsake[],
};

function demoStage(growth: number): PetStage {
  return growth >= PET_RULES.grownAt ? 'grown' : growth >= PET_RULES.babyAt ? 'baby' : 'egg';
}

function nextStageAt(stage: PetStage): number | null {
  return stage === 'egg' ? PET_RULES.babyAt : stage === 'baby' ? PET_RULES.grownAt : null;
}

// ---- What the screens call -------------------------------------------------------------------

/** The user's pet and streak, or null if they haven't adopted one yet (show the adopt screen). */
export async function getMyPet(): Promise<PetState | null> {
  if (useLocalDemo()) return demo.state;
  ensureConfigured();
  const { data, error } = await supabase.rpc('get_my_pet', { p_local_date: todayLocal() });
  if (error) petFail('load your pet', error);
  return data ? toPetState(data) : null;
}

/** Just the streak part of getMyPet (null if there's no pet yet). */
export async function getStreak(): Promise<Streak | null> {
  return (await getMyPet())?.streak ?? null;
}

/** Adopt an egg. Names are 1 to 24 characters. One pet per account. */
export async function adoptPet(name: string): Promise<PetState> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 24) throw new Error('Pet names need 1 to 24 characters.');

  if (useLocalDemo()) {
    if (demo.state) throw new Error('You already have a pet.');
    demo.state = {
      pet: {
        id: 1, name: trimmed, stage: 'egg', mood: 'calm', missedDays: 0, colorKey: 'green',
        genreKey: 'other', growth: 0, adoptedAt: new Date().toISOString(), accessories: [],
        checkedInToday: false, nextStageAt: PET_RULES.babyAt,
      },
      streak: { current: 0, longest: 0, lastCheckInDate: null, skipDaysAvailable: 0, skipDayPending: false },
    };
    return demo.state;
  }

  ensureConfigured();
  const { data, error } = await supabase.rpc('adopt_pet', { p_name: trimmed, p_local_date: todayLocal() });
  if (error) petFail('adopt your pet', error);
  return toPetState(data);
}

export async function renamePet(name: string): Promise<PetState> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 24) throw new Error('Pet names need 1 to 24 characters.');

  if (useLocalDemo()) {
    if (!demo.state) throw new Error('Adopt your pet first.');
    demo.state = { ...demo.state, pet: { ...demo.state.pet, name: trimmed } };
    return demo.state;
  }

  ensureConfigured();
  const { data, error } = await supabase.rpc('rename_pet', { p_name: trimmed, p_local_date: todayLocal() });
  if (error) petFail('rename your pet', error);
  return toPetState(data);
}

/**
 * The daily check-in: the song of the day (from getRecentSongs() in lib/spotify.ts), how the
 * user feels, and an optional note (max 140 characters). The pet takes on that mood.
 * Safe to call twice: another call the same day (or within 20 hours of the last check-in) just
 * returns the pet with alreadyCheckedIn = true. The song is only saved while Spotify is connected.
 */
export async function checkIn(song: SpotifySong, mood: Mood, note?: string): Promise<CheckInResult> {
  const trimmedNote = note?.trim() || null;
  if (trimmedNote && trimmedNote.length > 140) throw new Error('Notes can be up to 140 characters.');

  if (useLocalDemo()) return demoCheckIn(song, mood, trimmedNote);

  ensureConfigured();
  const { data, error } = await supabase.rpc('do_daily_check_in', {
    p_track: {
      spotify_track_id: song.spotifyTrackId,
      track_name: song.trackName,
      artist_name: song.artistName,
      album_art_url: song.albumArtUrl,
      genre: song.genre,
    },
    p_local_date: todayLocal(),
    p_mood: mood,
    p_note: trimmedNote,
  });
  if (error) petFail('check in', error);

  return {
    ...toPetState(data),
    alreadyCheckedIn: !!data.already_checked_in,
    usedSkipDay: !!data.used_skip_day,
    streakReset: !!data.streak_reset,
    stageChanged: !!data.stage_changed,
    newKeepsakes: (data.new_keepsakes ?? []) as KeepsakeKey[],
  };
}

/** Check-ins between two dates (YYYY-MM-DD, both included), oldest first. For My Week. */
export async function getMyCheckIns(fromDate: string, toDate: string): Promise<CheckIn[]> {
  if (useLocalDemo()) {
    return demo.checkIns.filter((c) => c.date >= fromDate && c.date <= toDate);
  }
  ensureConfigured();
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, check_in_date, spotify_track_id, track_name, artist_name, album_art_url, genre, mood_tag, note, was_skip_day')
    .gte('check_in_date', fromDate)
    .lte('check_in_date', toDate)
    .order('check_in_date', { ascending: true });
  if (error) petFail('load your check-ins', error);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    date: row.check_in_date,
    spotifyTrackId: row.spotify_track_id,
    trackName: row.track_name,
    artistName: row.artist_name,
    albumArtUrl: row.album_art_url,
    genre: row.genre,
    mood: row.mood_tag,
    note: row.note,
    wasSkipDay: row.was_skip_day,
  }));
}

/** Daily listening recaps between two dates, for My Week. Display only; never affects the pet. */
export async function getDailySummaries(fromDate: string, toDate: string): Promise<DailySummary[]> {
  if (useLocalDemo()) return [];
  ensureConfigured();
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('summary_date, track_count, top_genre, top_artist')
    .gte('summary_date', fromDate)
    .lte('summary_date', toDate)
    .order('summary_date', { ascending: true });
  if (error) petFail('load your week', error);

  return (data ?? []).map((row: any) => ({
    date: row.summary_date,
    trackCount: row.track_count,
    topGenre: row.top_genre,
    topArtist: row.top_artist,
  }));
}

/** Keepsakes unlocked so far, oldest first. */
export async function getMyKeepsakes(): Promise<Keepsake[]> {
  if (useLocalDemo()) return demo.keepsakes;
  ensureConfigured();
  const { data, error } = await supabase
    .from('keepsakes')
    .select('keepsake_key, unlocked_at')
    .order('unlocked_at', { ascending: true });
  if (error) petFail('load your keepsakes', error);
  return (data ?? []).map((row: any) => ({ key: row.keepsake_key, unlockedAt: row.unlocked_at }));
}

// ---- Demo-mode check-in (same rules as do_daily_check_in, kept simple) ------------------------

function demoCheckIn(song: SpotifySong, mood: Mood, note: string | null): CheckInResult {
  if (!demo.state) throw new Error('Adopt your pet before checking in.');
  const today = todayLocal();
  const { pet, streak } = demo.state;
  const base = { usedSkipDay: false, streakReset: false, stageChanged: false, newKeepsakes: [] as KeepsakeKey[] };
  if (streak.lastCheckInDate === today) return { ...demo.state, ...base, alreadyCheckedIn: true };

  const yesterday = daysBefore(1, today);
  let current = 1;
  let skips = streak.skipDaysAvailable;
  let usedSkipDay = false;
  if (streak.lastCheckInDate === yesterday) current = streak.current + 1;
  else if (streak.lastCheckInDate === daysBefore(2, today) && skips > 0) {
    skips -= 1;
    usedSkipDay = true;
    current = streak.current + 1;
  }
  if (current % PET_RULES.skipDayEvery === 0) skips = Math.min(PET_RULES.maxSkipDays, skips + 1);

  const growth = pet.growth + 1;
  const stage = demoStage(growth);
  const genreKey = song.genre !== 'other' ? song.genre : pet.genreKey;
  demo.checkIns.push({
    id: demo.checkIns.length + 1, date: today, spotifyTrackId: song.spotifyTrackId,
    trackName: song.trackName, artistName: song.artistName, albumArtUrl: song.albumArtUrl,
    genre: song.genre, mood, note, wasSkipDay: false,
  });

  const newKeepsakes = (Object.keys(PET_RULES.keepsakes) as KeepsakeKey[]).filter(
    (key) => growth >= PET_RULES.keepsakes[key] && !demo.keepsakes.some((k) => k.key === key)
  );
  for (const key of newKeepsakes) demo.keepsakes.push({ key, unlockedAt: new Date().toISOString() });

  demo.state = {
    pet: {
      ...pet, mood, missedDays: 0, growth, stage, genreKey, colorKey: COLOR_FOR_GENRE[genreKey],
      checkedInToday: true, nextStageAt: nextStageAt(stage),
    },
    streak: {
      current, longest: Math.max(streak.longest, current), lastCheckInDate: today,
      skipDaysAvailable: skips, skipDayPending: false,
    },
  };
  return {
    ...demo.state,
    alreadyCheckedIn: false,
    usedSkipDay,
    streakReset: !usedSkipDay && current === 1 && streak.current > 0,
    stageChanged: stage !== pet.stage,
    newKeepsakes,
  };
}

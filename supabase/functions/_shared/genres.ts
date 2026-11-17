// Genre text -> one of our genre keys. Same rules as public.genre_key_for() in
// supabase/migrations/20261110000000_pet_companion.sql and genreKeyFor() in syncd-app/lib/pet.ts.
// If you change one, change all three.
//
// Spotify no longer returns genres reliably: for many artists the `genres` list is empty (and
// recently-played track objects never include genres at all). Anything we can't place is 'other'.
// This is a simple per-user lookup: no cross-user totals, no AI.

export type GenreKey =
  | 'hip-hop' | 'pop' | 'rock' | 'r&b' | 'jazz' | 'electronic'
  | 'latin' | 'country' | 'classical' | 'indie' | 'other';

const RULES: [RegExp, GenreKey][] = [
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

export function genreKeyFor(genre: string | null | undefined): GenreKey {
  const g = (genre ?? '').trim().toLowerCase();
  if (!g) return 'other';
  for (const [pattern, key] of RULES) if (pattern.test(g)) return key;
  return 'other';
}

/** An artist's genre key: the first of their Spotify genres we recognise, else 'other'. */
export function genreKeyForArtist(genres: string[] | undefined): GenreKey {
  for (const g of genres ?? []) {
    const key = genreKeyFor(g);
    if (key !== 'other') return key;
  }
  return 'other';
}

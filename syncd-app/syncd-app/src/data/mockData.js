// Placeholder data standing in for the Node/Express + Spotify-backed API described
// in the SYNCD design doc. Swap these for real fetch() calls once the backend exists.

export const currentUser = {
  displayName: 'Sanjay',
  email: 'sanjay@example.com',
  subscriptionTier: 'free', // 'free' | 'premium'
  spotifyLinked: true,
}

export const tracks = [
  { id: 't1', title: 'Nightdrive', artist: 'Kilo Hz', album: 'Static Bloom', genre: 'Electronic', duration: '3:24', cover: '1', source: 'catalog' },
  { id: 't2', title: 'Glass Coast', artist: 'Reverie', album: 'Glass Coast', genre: 'Indie', duration: '2:58', cover: '2', source: 'catalog' },
  { id: 't3', title: 'Low Orbit', artist: 'Vantablk', album: 'Low Orbit EP', genre: 'Hip-Hop', duration: '3:41', cover: '3', source: 'catalog' },
  { id: 't4', title: 'Halflight', artist: 'Coral Youth', album: 'Halflight', genre: 'R&B', duration: '4:02', cover: '4', source: 'youtube' },
  { id: 't5', title: 'Static Bloom', artist: 'Kilo Hz', album: 'Static Bloom', genre: 'Electronic', duration: '3:12', cover: '5', source: 'catalog' },
  { id: 't6', title: 'Backroad Radio', artist: 'Juniper Lane', album: 'Backroad Radio', genre: 'Country', duration: '3:33', cover: '6', source: 'catalog' },
  { id: 't7', title: 'Undertow', artist: 'Vantablk', album: 'Low Orbit EP', genre: 'Hip-Hop', duration: '2:49', cover: '7', source: 'catalog' },
  { id: 't8', title: 'Marigold', artist: 'Reverie', album: 'Glass Coast', genre: 'Indie', duration: '3:15', cover: '8', source: 'youtube' },
]

export const playlists = [
  { id: 'p1', name: 'Discovered', description: 'Auto-added from Identify', trackIds: ['t3', 't7'], system: true },
  { id: 'p2', name: 'Late Night Drive', description: 'Made by Sanjay', trackIds: ['t1', 't5', 't4'] },
  { id: 'p3', name: 'Study / Focus', description: 'Made by Sanjay', trackIds: ['t2', 't8', 't6'] },
  { id: 'p4', name: 'Liked Songs', description: '124 songs', trackIds: ['t1', 't2', 't3', 't4', 't5'] },
]

export const recentlyPlayed = ['t1', 't4', 't3', 't6']

export const genreBreakdown = [
  { genre: 'Electronic', pct: 34 },
  { genre: 'Hip-Hop', pct: 26 },
  { genre: 'Indie', pct: 20 },
  { genre: 'R&B', pct: 12 },
  { genre: 'Country', pct: 8 },
]

export const listeningStreak = { days: 12, best: 21 }

// No real cover-art files ship with this frontend-only build, so covers are
// rendered as deterministic gradients derived from the track/playlist id —
// stable across renders, and each one reads as distinct inside the dark UI.

const PALETTES = [
  ['#3e7bfa', '#0b1330'],
  ['#6fe3ff', '#122047'],
  ['#7a5cff', '#0e1130'],
  ['#3ecbc0', '#0b1c2e'],
  ['#4f7dff', '#1a0e33'],
  ['#5b93ff', '#0a0e1a'],
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function coverGradient(seed) {
  const [a, b] = PALETTES[hash(String(seed)) % PALETTES.length]
  const angle = hash(String(seed) + 'x') % 360
  return { backgroundImage: `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)` }
}

export function findTrack(tracks, id) {
  return tracks.find((t) => t.id === id)
}

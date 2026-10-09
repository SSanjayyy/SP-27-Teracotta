import { useMemo, useState } from 'react'
import { SearchIcon } from './Icons.jsx'
import { tracks } from '../data/mockData.js'
import TrackList from './TrackList.jsx'

const GENRES = ['All', 'Electronic', 'Hip-Hop', 'Indie', 'R&B', 'Country']

export default function Search({ activeTrackId, onPlay }) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('All')

  const results = useMemo(() => {
    return tracks.filter((t) => {
      const matchesGenre = genre === 'All' || t.genre === genre
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      return matchesGenre && matchesQuery
    })
  }, [query, genre])

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow">Search & browse</div>
          <h1 className="view-title">Find something to play</h1>
        </div>
      </div>

      <div className="search-input-wrap">
        <SearchIcon className="search-icon" />
        <input
          className="search-input"
          placeholder="Songs, artists, albums — pulled from the Spotify catalog"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chip-row">
        {GENRES.map((g) => (
          <button
            key={g}
            className={`chip ${genre === g ? 'active' : ''}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {results.length > 0 ? (
        <TrackList tracks={results} activeTrackId={activeTrackId} onPlay={onPlay} />
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Nothing matches "{query}" in {genre === 'All' ? 'any genre' : genre}.
        </p>
      )}
    </div>
  )
}

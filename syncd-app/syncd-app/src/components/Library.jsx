import { playlists, tracks } from '../data/mockData.js'
import { coverGradient } from '../utils.js'

export default function Library({ onOpenPlaylist }) {
  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow">Your library</div>
          <h1 className="view-title">Playlists</h1>
        </div>
        <button className="btn btn-primary">+ New playlist</button>
      </div>

      <div className="grid">
        {playlists.map((p) => (
          <button
            key={p.id}
            className="card"
            style={{ textAlign: 'left', border: 'none' }}
            onClick={() => onOpenPlaylist(p.id)}
          >
            <div className="cover" style={coverGradient(p.id)} />
            <div className="cover-title">{p.name}</div>
            <div className="cover-sub">{p.trackIds.length} songs</div>
          </button>
        ))}
      </div>

      <section style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>All songs in your catalog</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
          {tracks.length} tracks across your playlists and listening history.
        </p>
      </section>
    </div>
  )
}

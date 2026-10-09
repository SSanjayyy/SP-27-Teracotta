import { tracks, playlists, recentlyPlayed, currentUser } from '../data/mockData.js'
import { coverGradient, findTrack } from '../utils.js'

export default function Home({ onPlay, onOpenPlaylist }) {
  const recent = recentlyPlayed.map((id) => findTrack(tracks, id)).filter(Boolean)
  const recommended = tracks.slice(4)

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow">Good to see you</div>
          <h1 className="view-title">{currentUser.displayName}'s world</h1>
        </div>
      </div>

      <section className="section-gap">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Jump back in</h3>
        <div className="grid">
          {recent.map((t) => (
            <button
              key={t.id}
              className="card"
              style={{ textAlign: 'left', border: 'none' }}
              onClick={() => onPlay(t)}
            >
              <div className="cover" style={coverGradient(t.id)} />
              <div className="cover-title">{t.title}</div>
              <div className="cover-sub">{t.artist}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="section-gap">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Your playlists</h3>
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
              <div className="cover-sub">{p.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Recommended for you</h3>
        <div className="grid">
          {recommended.map((t) => (
            <button
              key={t.id}
              className="card"
              style={{ textAlign: 'left', border: 'none' }}
              onClick={() => onPlay(t)}
            >
              <div className="cover" style={coverGradient(t.id)} />
              <div className="cover-title">{t.title}</div>
              <div className="cover-sub">{t.artist}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

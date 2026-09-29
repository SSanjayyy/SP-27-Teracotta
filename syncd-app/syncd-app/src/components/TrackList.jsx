import { PlayIcon, PlusIcon, MoreIcon } from './Icons.jsx'
import { coverGradient } from '../utils.js'

export default function TrackList({ tracks, activeTrackId, onPlay, onAdd }) {
  return (
    <div className="track-list">
      <div className="track-row header">
        <span>#</span>
        <span>Title</span>
        <span>Genre</span>
        <span style={{ textAlign: 'right' }}>Time</span>
        <span />
      </div>

      {tracks.map((track, i) => (
        <div
          key={track.id}
          className={`track-row ${activeTrackId === track.id ? 'active' : ''}`}
        >
          <span className="track-index">{i + 1}</span>

          <button
            className="track-main"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
            onClick={() => onPlay(track)}
          >
            <div className="track-thumb" style={coverGradient(track.id)} />
            <div className="track-titles">
              <div className="track-title">{track.title}</div>
              <div className="track-artist">
                {track.artist}
                {track.source === 'youtube' && <span className="badge badge-youtube" style={{ marginLeft: 8 }}>YouTube</span>}
              </div>
            </div>
          </button>

          <span style={{ fontSize: 13 }}>{track.genre}</span>
          <span className="track-duration">{track.duration}</span>

          <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {onAdd && (
              <button className="icon-btn" onClick={() => onAdd(track)} aria-label="Add to playlist">
                <PlusIcon />
              </button>
            )}
            <button className="icon-btn" onClick={() => onPlay(track)} aria-label="Play">
              <PlayIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

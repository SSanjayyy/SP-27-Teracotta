import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon } from './Icons.jsx'
import { coverGradient } from '../utils.js'

export default function NowPlayingBar({ track, isPlaying, onTogglePlay, onSkip }) {
  if (!track) {
    return (
      <div className="now-playing-bar">
        <div className="np-track" />
        <div className="np-controls">
          <span className="identify-status" style={{ margin: 0 }}>
            Nothing playing — pick a track to start
          </span>
        </div>
        <div className="np-right" />
      </div>
    )
  }

  return (
    <div className="now-playing-bar">
      <div className="np-track">
        <div className="np-thumb" style={coverGradient(track.id)} />
        <div className="track-titles">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
      </div>

      <div className="np-controls">
        <div className="np-buttons">
          <button className="icon-btn" onClick={() => onSkip(-1)} aria-label="Previous">
            <SkipBackIcon />
          </button>
          <button className="np-play" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="icon-btn" onClick={() => onSkip(1)} aria-label="Next">
            <SkipForwardIcon />
          </button>
        </div>
        <div className="np-progress">
          <div className="np-progress-fill" />
        </div>
      </div>

      <div className="np-right">
        {track.source === 'youtube' ? <span className="badge badge-youtube">YouTube fallback</span> : <span className="badge">SYNCD catalog</span>}
        <span>{track.duration}</span>
      </div>
    </div>
  )
}

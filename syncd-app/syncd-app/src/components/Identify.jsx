import { useState } from 'react'
import { MicIcon } from './Icons.jsx'
import { tracks } from '../data/mockData.js'
import { coverGradient } from '../utils.js'

// Real build: tap → record a short clip → POST to AudD/ACRCloud → on a match,
// append to the "Discovered" playlist (see Identify Log in the design doc).
// Here the round trip is simulated so the flow can be demoed without a backend.

export default function Identify({ onPlay }) {
  const [status, setStatus] = useState('idle') // idle | listening | matched | notfound
  const [match, setMatch] = useState(null)

  function startListening() {
    setStatus('listening')
    setMatch(null)
    setTimeout(() => {
      const found = tracks[Math.floor(Math.random() * tracks.length)]
      if (Math.random() < 0.85) {
        setMatch(found)
        setStatus('matched')
      } else {
        setStatus('notfound')
      }
    }, 2200)
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow">Identify</div>
          <h1 className="view-title">What's playing nearby?</h1>
        </div>
      </div>

      <div className="identify-stage">
        <div className="identify-ring">
          <button
            className={`identify-button ${status === 'listening' ? 'listening' : ''}`}
            onClick={startListening}
            disabled={status === 'listening'}
            aria-label="Start listening"
          >
            <MicIcon width={38} height={38} stroke="var(--void)" />
          </button>
        </div>

        <p className="identify-status">
          {status === 'idle' && 'Tap to listen — needs microphone access'}
          {status === 'listening' && 'Listening… sending a short clip to the recognition service'}
          {status === 'matched' && 'Match found and added to Discovered'}
          {status === 'notfound' && "Couldn't identify that one — try again closer to the source"}
        </p>

        {status === 'matched' && match && (
          <div className="identify-match">
            <div className="match-thumb" style={coverGradient(match.id)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="track-title" style={{ fontSize: 15 }}>{match.title}</div>
              <div className="track-artist">{match.artist}</div>
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => onPlay(match)}>
              Play
            </button>
          </div>
        )}

        {status === 'notfound' && (
          <button className="btn" onClick={startListening}>
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

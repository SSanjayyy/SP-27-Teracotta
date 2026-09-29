import { playlists, tracks } from '../data/mockData.js'
import { coverGradient, findTrack } from '../utils.js'
import TrackList from './TrackList.jsx'

export default function PlaylistView({ playlistId, activeTrackId, onPlay, onBack }) {
  const playlist = playlists.find((p) => p.id === playlistId)
  if (!playlist) return null

  const playlistTracks = playlist.trackIds.map((id) => findTrack(tracks, id)).filter(Boolean)

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 20, paddingLeft: 4 }} onClick={onBack}>
        ← Back
      </button>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap' }}>
        <div className="cover" style={{ ...coverGradient(playlist.id), width: 160, height: 160, marginBottom: 0, flexShrink: 0 }} />
        <div>
          <div className="eyebrow">{playlist.system ? 'Auto-generated playlist' : 'Playlist'}</div>
          <h1 className="view-title" style={{ fontSize: 34, marginBottom: 8 }}>{playlist.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {playlist.description} · {playlistTracks.length} songs
          </p>
        </div>
      </div>

      {playlistTracks.length > 0 ? (
        <TrackList tracks={playlistTracks} activeTrackId={activeTrackId} onPlay={onPlay} />
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {playlist.system
            ? 'Songs matched by Identify will show up here automatically.'
            : 'This playlist is empty — add songs from Search.'}
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import NowPlayingBar from './components/NowPlayingBar.jsx'
import Home from './components/Home.jsx'
import Search from './components/Search.jsx'
import Library from './components/Library.jsx'
import PlaylistView from './components/PlaylistView.jsx'
import Identify from './components/Identify.jsx'
import Habits from './components/Habits.jsx'
import Account from './components/Account.jsx'
import Auth from './components/Auth.jsx'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState('home')
  const [activePlaylistId, setActivePlaylistId] = useState(null)

  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function navigate(nextView) {
    setActivePlaylistId(null)
    setView(nextView)
  }

  function openPlaylist(id) {
    setActivePlaylistId(id)
    setView('playlist')
  }

  function playTrack(track) {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  function togglePlay() {
    if (currentTrack) setIsPlaying((p) => !p)
  }

  if (!authed) {
    return <Auth onAuthenticated={() => setAuthed(true)} />
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} onNavigate={navigate} onOpenPlaylist={openPlaylist} />

      <main className="app-main">
        {view === 'home' && <Home onPlay={playTrack} onOpenPlaylist={openPlaylist} />}
        {view === 'search' && <Search activeTrackId={currentTrack?.id} onPlay={playTrack} />}
        {view === 'library' && <Library onOpenPlaylist={openPlaylist} />}
        {view === 'playlist' && (
          <PlaylistView
            playlistId={activePlaylistId}
            activeTrackId={currentTrack?.id}
            onPlay={playTrack}
            onBack={() => navigate('library')}
          />
        )}
        {view === 'identify' && <Identify onPlay={playTrack} />}
        {view === 'habits' && <Habits />}
        {view === 'account' && <Account onUpgrade={() => navigate('account')} />}
      </main>

      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSkip={() => {}}
      />
    </div>
  )
}

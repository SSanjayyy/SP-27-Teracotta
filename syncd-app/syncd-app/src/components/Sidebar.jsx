import { HomeIcon, SearchIcon, LibraryIcon, MicIcon, PulseIcon, UserIcon, LogoMark } from './Icons.jsx'
import { playlists } from '../data/mockData.js'

const NAV = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'search', label: 'Search', icon: SearchIcon },
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'identify', label: 'Identify', icon: MicIcon },
  { id: 'habits', label: 'Listening Habits', icon: PulseIcon },
  { id: 'account', label: 'Account', icon: UserIcon },
]

export default function Sidebar({ view, onNavigate, onOpenPlaylist }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <span className="brand-name">SYNCD</span>
      </div>

      <nav className="nav-group">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${view === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon className="nav-icon" />
            {label}
          </button>
        ))}
      </nav>

      <div className="nav-group sidebar-playlists">
        <span className="nav-label">YOUR PLAYLISTS</span>
        {playlists.map((p) => (
          <button key={p.id} className="nav-item" onClick={() => onOpenPlaylist(p.id)}>
            <LogoMark className="nav-icon" width={16} height={16} />
            {p.name}
          </button>
        ))}
      </div>
    </aside>
  )
}

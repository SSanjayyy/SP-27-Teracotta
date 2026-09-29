// Minimal hand-rolled icon set (stroke-based, 20px grid) so the project has
// zero icon-library dependency. Each icon accepts standard svg props.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const HomeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
  </svg>
)

export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
)

export const LibraryIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="4" height="16" rx="1" />
    <rect x="10" y="4" width="4" height="16" rx="1" />
    <path d="M17.5 4.6 21 5.7a1 1 0 0 1 .7 1.24l-3.4 12.4a1 1 0 0 1-1.24.7L14 19" />
  </svg>
)

export const MicIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </svg>
)

export const PulseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h4l2-7 4 14 2-7h6" />
  </svg>
)

export const UserIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
)

export const PlayIcon = (p) => (
  <svg viewBox="0 0 24 24" width={p.width || 16} height={p.height || 16} fill="currentColor">
    <path d="M7 5.5v13a1 1 0 0 0 1.53.85l10.5-6.5a1 1 0 0 0 0-1.7L8.53 4.65A1 1 0 0 0 7 5.5Z" />
  </svg>
)

export const PauseIcon = (p) => (
  <svg viewBox="0 0 24 24" width={p.width || 16} height={p.height || 16} fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
)

export const SkipBackIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M19 5v14L8 12l11-7Z" />
    <path d="M5 5v14" />
  </svg>
)

export const SkipForwardIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M5 5v14l11-7L5 5Z" />
    <path d="M19 5v14" />
  </svg>
)

export const PlusIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const MoreIcon = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...p}>
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
)

export const LogoMark = (p) => (
  <svg viewBox="0 0 24 24" width={p.width || 18} height={p.height || 18} fill="none" {...p}>
    <path d="M4 15c3-6 6 6 9 0s4-9 7-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

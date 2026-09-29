import { genreBreakdown, listeningStreak, tracks } from '../data/mockData.js'

export default function Habits() {
  const topGenre = genreBreakdown[0]

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow">Listening habits</div>
          <h1 className="view-title">Your genre breakdown</h1>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{topGenre.pct}%</div>
          <div className="stat-label">Top genre — {topGenre.genre}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{listeningStreak.days}</div>
          <div className="stat-label">Day listening streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tracks.length}</div>
          <div className="stat-label">Tracks in your history</div>
        </div>
      </div>

      <section>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>By genre</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
          Calculated from your listening history and refreshed periodically in the background.
        </p>

        {genreBreakdown.map((g) => (
          <div className="habit-bar-row" key={g.genre}>
            <span style={{ fontSize: 14 }}>{g.genre}</span>
            <div className="habit-bar-track">
              <div className="habit-bar-fill" style={{ width: `${g.pct}%` }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>{g.pct}%</span>
          </div>
        ))}
      </section>
    </div>
  )
}

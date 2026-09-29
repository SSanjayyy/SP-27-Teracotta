import { currentUser } from '../data/mockData.js'

export default function Account({ onUpgrade }) {
  const isPremium = currentUser.subscriptionTier === 'premium'

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="eyebrow">Account</div>
          <h1 className="view-title">{currentUser.displayName}</h1>
          <p className="view-subtitle">{currentUser.email}</p>
        </div>
      </div>

      <section className="section-gap">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Plan</h3>
        <div className={`tier-card ${isPremium ? 'premium' : ''}`}>
          <span className="tier-badge">{isPremium ? 'PREMIUM' : 'FREE'}</span>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            {isPremium ? 'Ad-free listening' : 'Free, with ads between tracks'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            {isPremium
              ? 'Ads never interrupt what you\u2019re listening to.'
              : 'Upgrade any time to remove audio ads between tracks.'}
          </p>
          {!isPremium && (
            <button className="btn btn-primary btn-block" onClick={onUpgrade}>
              Upgrade to Premium
            </button>
          )}
        </div>
      </section>

      <section className="section-gap">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Connected accounts</h3>
        <div className="card" style={{ maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="track-title" style={{ fontSize: 14, marginBottom: 2 }}>Spotify</div>
            <div className="track-artist">
              {currentUser.spotifyLinked ? 'Linked — used for search & metadata' : 'Not linked'}
            </div>
          </div>
          <button className="btn">{currentUser.spotifyLinked ? 'Unlink' : 'Link'}</button>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Security</h3>
        <button className="btn" style={{ marginRight: 10 }}>Change password</button>
        <button className="btn btn-ghost">Sign out</button>
      </section>
    </div>
  )
}

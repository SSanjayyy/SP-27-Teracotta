import { useState } from 'react'
import { LogoMark } from './Icons.jsx'

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'

  function handleSubmit(e) {
    e.preventDefault()
    onAuthenticated()
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 24 }}>
          <div className="brand-mark" />
          <span className="brand-name">SYNCD</span>
        </div>

        <h1 style={{ fontSize: 22, marginBottom: 6 }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          {mode === 'login' ? 'Log in to pick up where you left off.' : 'Spotify linking is optional — you can add it later.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" required />
          </div>

          {mode === 'login' && (
            <button type="button" className="btn btn-ghost" style={{ padding: '4px 0', fontSize: 12 }}>
              Forgot password?
            </button>
          )}

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="btn btn-block" onClick={onAuthenticated}>
          <LogoMark width={14} height={14} style={{ marginRight: 8, verticalAlign: -2 }} />
          Continue with Spotify
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="btn-ghost"
            style={{ background: 'none', border: 'none', color: 'var(--electric-bright)', fontWeight: 600, padding: 0 }}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}

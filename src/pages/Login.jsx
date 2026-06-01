import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [tab, setTab] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  async function handleEmailSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) setError(error.message)
  }

  async function handleEmailSignUp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUpWithEmail(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSignedUp(true)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-logo-icon"><span>A</span></div>
          <h1 className="brand-title">ARCFLOW</h1>
          <p className="brand-subtitle">ARCHITECTURE PORTFOLIO &amp; PROJECT CRM</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '1px solid var(--border-color)' }}>
          {['signin', 'signup'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSignedUp(false) }}
              style={{
                flex: 1, padding: '8px 0', background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid var(--accent-teal)' : '2px solid transparent',
                color: tab === t ? 'var(--accent-teal)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: 1,
              }}
            >
              {t === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          ))}
        </div>

        {signedUp ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            <i className="fa-solid fa-circle-check" style={{ color: 'var(--status-completed)', fontSize: 32, marginBottom: 12, display: 'block' }}></i>
            Account created! Check your email to confirm, then sign in.<br />
            Your access will be activated by the Principal Architect.
          </div>
        ) : (
          <>
            {error && (
              <p style={{ color: 'var(--priority-high)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>{error}</p>
            )}

            <form onSubmit={tab === 'signin' ? handleEmailSignIn : handleEmailSignUp} style={{ marginTop: 20 }}>
              {tab === 'signup' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text" required className="modal-input" placeholder="e.g. Jane Smith"
                    value={name} onChange={e => setName(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Email</label>
                <input
                  type="email" required className="modal-input" placeholder="you@studio.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Password</label>
                <input
                  type="password" required className="modal-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            <button className="login-btn" onClick={signInWithGoogle} style={{ width: '100%', background: 'var(--bg-secondary)' }}>
              <i className="fa-brands fa-google" style={{ marginRight: 10 }}></i>
              Continue with Google
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          Access is granted by your Principal Architect after first sign-in.
        </p>
      </div>
    </div>
  )
}

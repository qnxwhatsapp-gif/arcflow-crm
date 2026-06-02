import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState(null) // null = checking

  // Verify a recovery session actually exists before showing the form
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  // Still checking session
  if (hasSession === null) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="brand-header">
            <div className="brand-logo-icon"><span>A</span></div>
            <h1 className="brand-title">ARCFLOW</h1>
            <p className="brand-subtitle">SET NEW PASSWORD</p>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 24 }}>Verifying reset link…</p>
        </div>
      </div>
    )
  }

  // No session — link expired or page was refreshed
  if (!hasSession) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="brand-header">
            <div className="brand-logo-icon"><span>A</span></div>
            <h1 className="brand-title">ARCFLOW</h1>
            <p className="brand-subtitle">SET NEW PASSWORD</p>
          </div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <i className="fa-solid fa-link-slash" style={{ fontSize: 32, color: 'var(--priority-high)', marginBottom: 12, display: 'block' }}></i>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              This reset link has expired or already been used.<br />
              Please request a new one.
            </p>
            <button className="login-btn" style={{ width: '100%' }} onClick={() => navigate('/')}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-logo-icon"><span>A</span></div>
          <h1 className="brand-title">ARCFLOW</h1>
          <p className="brand-subtitle">SET NEW PASSWORD</p>
        </div>

        {error && (
          <p style={{ color: 'var(--priority-high)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>{error}</p>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>New Password</label>
            <input
              type="password" required className="modal-input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Confirm Password</label>
            <input
              type="password" required className="modal-input" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

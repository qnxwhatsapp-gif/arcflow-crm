import { useAuth } from '../contexts/AuthContext'

export default function Pending() {
  const { profile, signOut } = useAuth()

  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="brand-logo-icon" style={{ margin: '0 auto 20px' }}><span>A</span></div>
        <h2 className="brand-title" style={{ fontSize: 22, marginBottom: 12 }}>Access Pending</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
          You're signed in as <strong>{profile?.email}</strong>.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
          Your account is awaiting role assignment from the Principal Architect. Please contact them to gain access.
        </p>
        <button className="action-btn" onClick={signOut}>
          <i className="fa-solid fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    </div>
  )
}

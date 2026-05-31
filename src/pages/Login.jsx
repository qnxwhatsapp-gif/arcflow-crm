import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-logo-icon"><span>A</span></div>
          <h1 className="brand-title">ARCFLOW</h1>
          <p className="brand-subtitle">ARCHITECTURE PORTFOLIO &amp; PROJECT CRM</p>
        </div>

        <button className="login-btn" onClick={signInWithGoogle} style={{ marginTop: 24 }}>
          <i className="fa-brands fa-google" style={{ marginRight: 10 }}></i>
          Sign in with Google
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
          Access is granted by your Principal Architect after first sign-in.
        </p>
      </div>
    </div>
  )
}

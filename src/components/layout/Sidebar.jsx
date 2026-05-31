import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><span>A</span></div>
        <div className="sidebar-logo-text">ARCFLOW</div>
      </div>

      <div className="user-profile-badge">
        <div className="profile-avatar">{profile?.avatar_initials || '?'}</div>
        <div className="profile-info">
          <div className="profile-name">{profile?.name}</div>
          <div className={`profile-role role-${profile?.role}`}>{profile?.role}</div>
        </div>
      </div>

      <ul className="nav-menu">
        <li className="nav-item">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/dashboard">
            <i className="fa-solid fa-chart-line"></i>
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/projects">
            <i className="fa-solid fa-cubes"></i>
            <span>Projects</span>
          </NavLink>
        </li>
        {profile?.role !== 'client' && (
          <li className="nav-item">
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/team">
              <i className="fa-solid fa-users"></i>
              <span>Team &amp; Clients</span>
            </NavLink>
          </li>
        )}
      </ul>

      <div className="logout-btn-container">
        <button className="nav-link" onClick={handleSignOut} style={{ background: 'none', border: 'none', width: '100%', color: 'var(--priority-high)', cursor: 'pointer' }}>
          <i className="fa-solid fa-sign-out-alt"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

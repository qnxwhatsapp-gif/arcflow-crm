import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../contexts/PermissionsContext'

const TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/projects': 'Projects Portfolio',
  '/team': 'Studio & Client Directory',
}

export default function TopNavbar({ onAction }) {
  const location = useLocation()
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()

  const title = TITLES[location.pathname] || 'Project Workspace'

  return (
    <header className="top-navbar">
      <h2 className="navbar-title">{title}</h2>
      <div className="navbar-actions">
        {location.pathname === '/projects' && hasPermission('canCreateProjects') && (
          <button className="action-btn primary" onClick={() => onAction?.('createProject')}>
            <i className="fa-solid fa-plus"></i> New Project
          </button>
        )}
        {location.pathname === '/dashboard' && hasPermission('canCreateProjects') && (
          <button className="action-btn primary" onClick={() => navigate('/projects')}>
            <i className="fa-solid fa-plus"></i> New Project
          </button>
        )}
      </div>
    </header>
  )
}

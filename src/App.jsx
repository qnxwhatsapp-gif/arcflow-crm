import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PermissionsProvider } from './contexts/PermissionsContext'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Team from './pages/Team'
import Sidebar from './components/layout/Sidebar'
import TopNavbar from './components/layout/TopNavbar'

function AppShell() {
  const { session, profile } = useAuth()

  if (session === undefined) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (!session) return <Login />

  if (!profile || profile.role === 'pending') return <Pending />

  return (
    <PermissionsProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-workspace">
          <TopNavbar />
          <section className="workspace-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </section>
        </main>
      </div>
    </PermissionsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

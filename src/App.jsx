import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PermissionsProvider } from './contexts/PermissionsContext'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Team from './pages/Team'
import ResetPassword from './pages/ResetPassword'
import Reports from './pages/Reports'
import Sidebar from './components/layout/Sidebar'
import TopNavbar from './components/layout/TopNavbar'

function AppShell() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const openCreateProjectRef = useRef(null)

  // Detect Supabase recovery session from URL hash and redirect to reset page
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      navigate('/reset-password', { replace: true })
    }
  }, [])

  function handleNavbarAction(action) {
    if (action === 'createProject') openCreateProjectRef.current?.()
  }

  if (session === undefined) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>
  }

  // Allow reset-password page regardless of session state
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />
  }

  if (!session) return <Login />

  if (!profile || profile.role === 'pending') return <Pending />

  return (
    <PermissionsProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-workspace">
          <TopNavbar onAction={handleNavbarAction} />
          <section className="workspace-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects registerOpenModal={cb => { openCreateProjectRef.current = cb }} />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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

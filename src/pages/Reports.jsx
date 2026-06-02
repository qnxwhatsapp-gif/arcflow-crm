// src/pages/Reports.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Reports() {
  const { profile } = useAuth()
  if (profile?.role !== 'principal') return <Navigate to="/dashboard" replace />
  return <div style={{ padding: 24, color: 'var(--text-primary)' }}>Reports — coming soon</div>
}

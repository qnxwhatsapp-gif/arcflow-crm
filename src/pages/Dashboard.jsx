import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionsContext'
import { useProjects } from '../hooks/useProjects'
import { supabase } from '../lib/supabase'
import StatCard from '../components/dashboard/StatCard'
import ActivityFeed from '../components/dashboard/ActivityFeed'

export default function Dashboard() {
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const { projects, loading } = useProjects()
  const navigate = useNavigate()
  const [recentComments, setRecentComments] = useState([])

  const userProjects = projects.filter(p => {
    if (profile?.role === 'principal') return true
    if (profile?.role === 'client') return p.client_id === profile.id
    return p.lead_id === profile?.id
  })

  useEffect(() => {
    if (!userProjects.length) return
    const ids = userProjects.map(p => p.id)
    supabase
      .from('comments')
      .select('*, author:author_id(id,name,role)')
      .in('project_id', ids)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        const withNames = (data || []).map(c => ({
          ...c,
          projectName: userProjects.find(p => p.id === c.project_id)?.name || ''
        }))
        setRecentComments(withNames)
      })
  }, [projects])

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>

  const totalTasks = userProjects.reduce((s, p) => s + (p.tasks?.length || 0), 0)
  const completedTasks = userProjects.reduce((s, p) => s + (p.tasks?.filter(t => t.status === 'completed').length || 0), 0)
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const portfolioBudget = userProjects.reduce((s, p) => s + (p.budget || 0), 0)

  return (
    <>
      <div className="dashboard-grid">
        {hasPermission('canViewFinancials') ? (
          <StatCard title="Portfolio Valuation" value={`$${portfolioBudget.toLocaleString()}`} desc={`Across ${userProjects.length} commissions`} color="gold" />
        ) : (
          <StatCard title="My Projects" value={userProjects.length} desc="Projects assigned or leading" color="gold" />
        )}
        <StatCard title="Active Projects" value={userProjects.length} desc="Currently in drafting/review" color="teal" />
        <StatCard title="Task Completion" value={`${completionRate}%`} desc={`${completedTasks} of ${totalTasks} milestones`} color="green" />
        <StatCard title="Pending Tasks" value={totalTasks - completedTasks} desc="Awaiting completion" color="purple" />
      </div>

      <div className="dashboard-split">
        <div className="content-block">
          <div className="block-header">
            <h3 className="block-title">Active Projects</h3>
            <button className="action-btn" onClick={() => navigate('/projects')}>View All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="project-list-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Lead Architect</th>
                  <th>Phase</th>
                  <th>Progress</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {userProjects.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active projects.</td></tr>
                ) : userProjects.map(p => (
                  <tr key={p.id} className="project-row" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td>
                      <div className="project-name-cell">
                        <strong>{p.name}</strong>
                        <span className="project-client-name">{p.client?.company || 'Private Client'}</span>
                      </div>
                    </td>
                    <td>{p.lead?.name}</td>
                    <td><span className={`phase-badge phase-${p.phase.toLowerCase()}`}>{p.phase}</span></td>
                    <td>
                      <div className="progress-container"><div className="progress-bar" style={{ width: '0%' }}></div></div>
                      <span className="progress-text">–</span>
                    </td>
                    <td>{p.deadline ? new Date(p.deadline).toLocaleDateString() : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3 className="block-title">Updates &amp; Feedback</h3>
          </div>
          <ActivityFeed comments={recentComments} />
        </div>
      </div>
    </>
  )
}

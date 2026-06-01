import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionsContext'
import AddClientModal from '../components/modals/AddClientModal'
import AddStaffModal from '../components/modals/AddStaffModal'

const PERMISSION_DEFS = [
  { key: 'can_create_projects', label: 'Initialize New Commission Projects', desc: 'Allows creating projects from dashboard/portfolio panels.' },
  { key: 'can_create_tasks', label: 'Manage Milestones & Subtasks', desc: 'Allows creating tasks, subtasks, and shifting Kanban statuses.' },
  { key: 'can_log_work', label: 'Submit Daily Work Logs', desc: 'Allows entering hours/days spent on tasks.' },
  { key: 'can_change_phase', label: 'Progress Project Phases (SD-CA)', desc: 'Allows advancing active project development phases.' },
  { key: 'can_view_financials', label: 'View Portfolio Valuation & Budgets', desc: 'Allows seeing financial metrics and budget figures.' },
  { key: 'can_moderate_comments', label: 'Post Collaboration Feed Comments', desc: 'Allows writing feedback messages.' },
]

export default function Team() {
  const { profile } = useAuth()
  const { permissions, updatePermission } = usePermissions()
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddStaff, setShowAddStaff] = useState(false)

  async function loadData() {
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('projects').select('id,name,client_id,lead_id'),
    ])
    setUsers(u || [])
    setProjects(p || [])
  }

  useEffect(() => { loadData() }, [])

  const staff = users.filter(u => u.role !== 'client' && u.role !== 'pending')
  const clients = users.filter(u => u.role === 'client')

  function getAssignedProjects(userId) {
    return projects.filter(p => p.client_id === userId || p.lead_id === userId).map(p => p.name).join(', ') || 'None'
  }

  async function handleRoleChange(userId, newRole) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    loadData()
  }

  const [resetSent, setResetSent] = useState(null) // stores email string when reset was sent

  async function handleResetPassword(email) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    setResetSent(email)
    setTimeout(() => setResetSent(null), 3000)
  }

  return (
    <>
      <div className="content-block" style={{ marginBottom: 24 }}>
        <div className="block-header">
          <h3 className="block-title">Studio Staff & Architects</h3>
          {profile?.role === 'principal' && (
            <button className="action-btn primary" onClick={() => setShowAddStaff(true)}>
              <i className="fa-solid fa-plus"></i> Add Staff
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="project-list-table">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Assigned Projects</th>{profile?.role === 'principal' && <th>Change Role</th>}{profile?.role === 'principal' && <th>Password</th>}</tr></thead>
            <tbody>
              {staff.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td><span className={`phase-badge phase-${u.role === 'principal' ? 'sd' : 'dd'}`}>{u.role}</span></td>
                  <td>{u.email}</td>
                  <td style={{ fontSize: 12 }}>{getAssignedProjects(u.id)}</td>
                  {profile?.role === 'principal' && (
                    <td>
                      <select className="modal-select" style={{ fontSize: 12, padding: '4px 8px', height: 'auto' }} value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                        <option value="principal">Principal Architect</option>
                        <option value="architect">Project Architect</option>
                        <option value="manager">Project Manager</option>
                        <option value="intern">Intern / Junior</option>
                        <option value="pending">Pending (no access)</option>
                      </select>
                    </td>
                  )}
                  {profile?.role === 'principal' && (
                    <td>
                      {resetSent === u.email ? (
                        <span style={{ fontSize: 12, color: 'var(--status-completed)' }}>✓ Email sent</span>
                      ) : (
                        <button className="action-btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleResetPassword(u.email)}>
                          Reset Password
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-block">
        <div className="block-header">
          <h3 className="block-title">Client Accounts</h3>
          {profile?.role === 'principal' && (
            <button className="action-btn primary" onClick={() => setShowAddClient(true)}>
              <i className="fa-solid fa-plus"></i> Add Client
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="project-list-table">
            <thead><tr><th>Client Name</th><th>Company</th><th>Email</th><th>Associated Project</th>{profile?.role === 'principal' && <th>Password</th>}</tr></thead>
            <tbody>
              {clients.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.company || '–'}</td>
                  <td>{u.email}</td>
                  <td style={{ fontSize: 12 }}>{getAssignedProjects(u.id)}</td>
                  {profile?.role === 'principal' && (
                    <td>
                      {resetSent === u.email ? (
                        <span style={{ fontSize: 12, color: 'var(--status-completed)' }}>✓ Email sent</span>
                      ) : (
                        <button className="action-btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleResetPassword(u.email)}>
                          Reset Password
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {profile?.role === 'principal' && users.filter(u => u.role === 'pending').length > 0 && (
        <div className="content-block" style={{ marginTop: 24 }}>
          <div className="block-header">
            <h3 className="block-title" style={{ color: 'var(--priority-medium)' }}>
              <i className="fa-solid fa-clock"></i> Pending Access Requests
            </h3>
          </div>
          <table className="project-list-table">
            <thead><tr><th>Email</th><th>Signed Up</th><th>Assign Role</th></tr></thead>
            <tbody>
              {users.filter(u => u.role === 'pending').map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <select className="modal-select" style={{ fontSize: 12, padding: '4px 8px', height: 'auto' }} defaultValue="" onChange={e => { if (e.target.value) handleRoleChange(u.id, e.target.value) }}>
                      <option value="" disabled>Assign role...</option>
                      <option value="architect">architect</option>
                      <option value="principal">principal</option>
                      <option value="client">client</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {profile?.role === 'principal' && (
        <div className="content-block" style={{ marginTop: 24 }}>
          <div className="block-header" style={{ marginBottom: 12 }}>
            <h3 className="block-title"><i className="fa-solid fa-user-shield"></i> Studio Role Access Control (ACL)</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Principals always retain full privileges. Configure capabilities for Architects and Clients below.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="permissions-matrix-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Key</th>
                  <th>Architect Role</th>
                  <th>Client Role</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_DEFS.map(def => {
                  const archVal = permissions.architect?.[def.key] ?? false
                  const clientVal = permissions.client?.[def.key] ?? false
                  return (
                    <tr key={def.key}>
                      <td>
                        <strong>{def.label}</strong><br />
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{def.desc}</span>
                      </td>
                      <td><code>{def.key}</code></td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={archVal} onChange={e => updatePermission('architect', def.key, e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={clientVal} onChange={e => updatePermission('client', def.key, e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} onAdded={loadData} />
      <AddStaffModal open={showAddStaff} onClose={() => setShowAddStaff(false)} onAdded={loadData} />
    </>
  )
}

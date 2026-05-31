import { useState, useEffect } from 'react'
import { usePermissions } from '../contexts/PermissionsContext'
import { useProjects } from '../hooks/useProjects'
import ProjectRow from '../components/projects/ProjectRow'
import CreateProjectModal from '../components/modals/CreateProjectModal'

export default function Projects({ registerOpenModal }) {
  const { hasPermission } = usePermissions()
  const { projects, loading, createProject } = useProjects()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    registerOpenModal?.(() => setShowModal(true))
  }, [registerOpenModal])

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.lead?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="content-block">
        <div className="block-header">
          <h3 className="block-title">All Architecture Projects</h3>
          <div className="navbar-actions">
            <input
              type="text"
              className="modal-input"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200, padding: '6px 12px' }}
            />
            {hasPermission('canCreateProjects') && (
              <button className="action-btn primary" onClick={() => setShowModal(true)}>
                <i className="fa-solid fa-plus"></i> New Project
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="project-list-table">
            <thead>
              <tr>
                <th>Project Name &amp; Client</th>
                <th>Lead</th>
                <th>Phase</th>
                <th>Task Status</th>
                <th>Progress</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No projects found.</td></tr>
              ) : filtered.map(p => <ProjectRow key={p.id} project={p} />)}
            </tbody>
          </table>
        </div>
      </div>

      <CreateProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={createProject}
      />
    </>
  )
}

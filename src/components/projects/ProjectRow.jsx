// src/components/projects/ProjectRow.jsx
import { useNavigate } from 'react-router-dom'
import DeadlineBadge from '../ui/DeadlineBadge'

export default function ProjectRow({ project }) {
  const navigate = useNavigate()
  const client = project.client
  const lead = project.lead
  const clientStr = client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : 'Private Client'

  const totalTasks = project.tasks?.length || 0
  const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <tr className="project-row" onClick={() => navigate(`/projects/${project.id}`)}>
      <td>
        <div className="project-name-cell">
          <strong>{project.name}</strong>
          <span className="project-client-name">{clientStr}</span>
        </div>
      </td>
      <td>{lead?.name || '–'}</td>
      <td><span className={`phase-badge phase-${project.phase.toLowerCase()}`}>{project.phase}</span></td>
      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{completedTasks}/{totalTasks}</span></td>
      <td>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : '–'}</span>
          <DeadlineBadge deadline={project.deadline} />
        </div>
      </td>
    </tr>
  )
}

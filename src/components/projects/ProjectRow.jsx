import { useNavigate } from 'react-router-dom'

export default function ProjectRow({ project }) {
  const navigate = useNavigate()
  const client = project.client
  const lead = project.lead
  const clientStr = client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : 'Private Client'

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
      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>–</span></td>
      <td>
        <div className="progress-container"><div className="progress-bar" style={{ width: '0%' }}></div></div>
        <span className="progress-text">–</span>
      </td>
      <td>{project.deadline ? new Date(project.deadline).toLocaleDateString() : '–'}</td>
    </tr>
  )
}

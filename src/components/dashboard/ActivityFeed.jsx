import { useNavigate } from 'react-router-dom'

export default function ActivityFeed({ comments }) {
  const navigate = useNavigate()

  if (!comments.length) {
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No updates logged yet.</div>
  }

  return (
    <div className="activity-feed">
      {comments.slice(0, 5).map(c => {
        const role = c.author?.role || 'architect'
        const iconColor = role === 'client' ? 'green' : role === 'principal' ? 'gold' : 'teal'
        const dateStr = new Date(c.created_at).toLocaleDateString() + ' ' + new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        return (
          <div key={c.id} className="activity-item">
            <div className={`activity-icon ${iconColor}`}>
              <i className="fa-solid fa-comment-dots"></i>
            </div>
            <div className="activity-details">
              <div>
                <strong>{c.author?.name}</strong> in{' '}
                <span
                  style={{ color: 'var(--accent-teal)', cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${c.project_id}`)}
                >
                  {c.projectName}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>"{c.text}"</div>
              <div className="activity-time">{dateStr}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

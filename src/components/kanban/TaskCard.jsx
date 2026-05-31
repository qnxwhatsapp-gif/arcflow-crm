export default function TaskCard({ task, canEdit, onDragStart, onClick }) {
  const isOverdue = task.status !== 'completed' && task.deadline && new Date(task.deadline) < new Date()
  const subtasks = task.subtasks || []
  const completedSubs = subtasks.filter(s => s.status === 'completed').length

  return (
    <div
      className="kanban-card"
      draggable={canEdit}
      onDragStart={canEdit ? () => onDragStart(task.id) : undefined}
      onClick={() => onClick(task)}
    >
      <div className="card-header">
        <span className={`priority-tag priority-${(task.priority || 'medium').toLowerCase()}`}>{task.priority}</span>
        <span className={`phase-badge phase-${(task.phase || 'sd').toLowerCase()}`} style={{ fontSize: 9, padding: '2px 4px' }}>{task.phase}</span>
      </div>
      <div className="card-title">{task.title}</div>
      {task.description && <div className="card-desc">{task.description}</div>}

      {subtasks.length > 0 && (
        <div className="subtask-list-mini">
          <div className="flex-between" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            <span><i className="fa-solid fa-list-check"></i> Subtasks: {completedSubs}/{subtasks.length}</span>
            <span>{Math.round((completedSubs / subtasks.length) * 100)}%</span>
          </div>
          <div className="progress-container" style={{ height: 4, marginTop: 2 }}>
            <div className="progress-bar" style={{ width: `${Math.round((completedSubs / subtasks.length) * 100)}%`, height: '100%' }}></div>
          </div>
        </div>
      )}

      <div className="card-footer" style={{ marginTop: 10 }}>
        <div className={`card-deadline${isOverdue ? ' overdue' : ''}`}>
          <i className={`fa-solid ${isOverdue ? 'fa-triangle-exclamation' : 'fa-calendar-days'}`}></i>
          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '–'}</span>
        </div>
        {task.assignee && (
          <div className="card-assignee">
            <div className="assignee-dot">{task.assignee.avatar_initials}</div>
          </div>
        )}
      </div>
    </div>
  )
}

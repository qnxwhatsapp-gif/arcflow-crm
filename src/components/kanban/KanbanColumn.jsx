import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo: { label: 'To Do', cssClass: 'todo' },
  inprogress: { label: 'In Progress', cssClass: 'inprogress' },
  inreview: { label: 'In Review', cssClass: 'inreview' },
  completed: { label: 'Completed', cssClass: 'completed' },
}

export default function KanbanColumn({ status, tasks, canEdit, onDragStart, onDrop, onTaskClick }) {
  const config = COLUMN_CONFIG[status]

  return (
    <div className="kanban-column">
      <div className={`column-header ${config.cssClass}`}>
        <span className="column-title">{config.label}</span>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div
        className="kanban-cards-wrapper"
        onDragOver={e => e.preventDefault()}
        onDrop={() => onDrop(status)}
      >
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '30px 10px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            No active tasks
          </div>
        ) : tasks.map(t => (
          <TaskCard key={t.id} task={t} canEdit={canEdit} onDragStart={onDragStart} onClick={onTaskClick} />
        ))}
      </div>
    </div>
  )
}

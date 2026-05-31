import { useState } from 'react'
import KanbanColumn from './KanbanColumn'

const STATUSES = ['todo', 'inprogress', 'inreview', 'completed']

export default function KanbanBoard({ tasks, canEdit, onStatusChange, onTaskClick }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  function handleDrop(newStatus) {
    if (!draggedTaskId) return
    onStatusChange(draggedTaskId, newStatus)
    setDraggedTaskId(null)
  }

  return (
    <div className="project-boards-container">
      {STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter(t => t.status === status)}
          canEdit={canEdit}
          onDragStart={setDraggedTaskId}
          onDrop={handleDrop}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  )
}

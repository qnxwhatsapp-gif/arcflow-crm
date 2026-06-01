// src/components/ui/DeadlineBadge.jsx
import { getDeadlineStatus } from '../../utils/deadlineStatus'

/**
 * Renders a coloured pill badge for overdue or soon-due items.
 * Renders nothing for 'ok' or null status.
 */
export default function DeadlineBadge({ deadline }) {
  const status = getDeadlineStatus(deadline)
  if (!status || status === 'ok') return null

  const isOverdue = status === 'overdue'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.5,
      padding: '2px 7px',
      borderRadius: 10,
      background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
      color: isOverdue ? 'var(--priority-high)' : '#f59e0b',
      border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
    }}>
      {isOverdue ? '⚠' : '⏰'} {isOverdue ? 'Overdue' : 'Due soon'}
    </span>
  )
}

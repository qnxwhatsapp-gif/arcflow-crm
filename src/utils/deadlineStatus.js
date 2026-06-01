/**
 * Returns deadline urgency status for a date string.
 * @param {string|null|undefined} dateStr - ISO date string e.g. '2026-06-15'
 * @returns {'overdue'|'soon'|'ok'|null}
 */
export function getDeadlineStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due - today) / 86400000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 2) return 'soon'
  return 'ok'
}

const MS_PER_DAY = 86400000 // 1000ms × 60s × 60m × 24h
const SOON_THRESHOLD_DAYS = 2 // Warning window: today to 2 days out

/**
 * Returns deadline urgency status for a date string.
 * Returns 'ok' for invalid date strings (assumes caller validates input).
 * @param {string|null|undefined} dateStr - ISO date string e.g. '2026-06-15'
 * @returns {'overdue'|'soon'|'ok'|null}
 */
export function getDeadlineStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due - today) / MS_PER_DAY)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= SOON_THRESHOLD_DAYS) return 'soon'
  return 'ok'
}

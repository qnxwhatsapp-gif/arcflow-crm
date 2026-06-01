import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDeadlineStatus } from './deadlineStatus'

describe('getDeadlineStatus', () => {
  beforeEach(() => {
    // Fix "today" to 2026-06-01
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns null for no date', () => {
    expect(getDeadlineStatus(null)).toBe(null)
    expect(getDeadlineStatus(undefined)).toBe(null)
    expect(getDeadlineStatus('')).toBe(null)
  })

  it('returns overdue for past date', () => {
    expect(getDeadlineStatus('2026-05-31')).toBe('overdue')
    expect(getDeadlineStatus('2026-01-01')).toBe('overdue')
  })

  it('returns soon for today', () => {
    expect(getDeadlineStatus('2026-06-01')).toBe('soon')
  })

  it('returns soon for 1 day away', () => {
    expect(getDeadlineStatus('2026-06-02')).toBe('soon')
  })

  it('returns soon for exactly 2 days away', () => {
    expect(getDeadlineStatus('2026-06-03')).toBe('soon')
  })

  it('returns ok for 3 days away', () => {
    expect(getDeadlineStatus('2026-06-04')).toBe('ok')
  })

  it('returns ok for far future', () => {
    expect(getDeadlineStatus('2027-01-01')).toBe('ok')
  })
})

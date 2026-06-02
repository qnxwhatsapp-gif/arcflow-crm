import { describe, it, expect } from 'vitest'
import { computeWorkSummary } from './generateProjectPdf'

describe('computeWorkSummary', () => {
  it('sums hours correctly (hours unit)', () => {
    const logs = [
      { user: { name: 'Alice' }, duration: '4', unit: 'hours' },
      { user: { name: 'Alice' }, duration: '2', unit: 'hours' },
    ]
    const summary = computeWorkSummary(logs)
    expect(summary[0]).toEqual({ name: 'Alice', hours: 6 })
  })

  it('converts days to hours (1 day = 8 hours)', () => {
    const logs = [
      { user: { name: 'Bob' }, duration: '2', unit: 'days' },
    ]
    const summary = computeWorkSummary(logs)
    expect(summary[0]).toEqual({ name: 'Bob', hours: 16 })
  })

  it('mixes hours and days for the same person', () => {
    const logs = [
      { user: { name: 'Carol' }, duration: '1', unit: 'days' },
      { user: { name: 'Carol' }, duration: '3', unit: 'hours' },
    ]
    const summary = computeWorkSummary(logs)
    expect(summary[0]).toEqual({ name: 'Carol', hours: 11 })
  })

  it('sorts by hours descending', () => {
    const logs = [
      { user: { name: 'Alpha' }, duration: '2', unit: 'hours' },
      { user: { name: 'Beta' }, duration: '10', unit: 'hours' },
      { user: { name: 'Gamma' }, duration: '5', unit: 'hours' },
    ]
    const summary = computeWorkSummary(logs)
    expect(summary.map(s => s.name)).toEqual(['Beta', 'Gamma', 'Alpha'])
  })

  it('returns empty array for no logs', () => {
    expect(computeWorkSummary([])).toEqual([])
  })

  it('handles logs with null user gracefully', () => {
    const logs = [
      { user: null, duration: '3', unit: 'hours' },
    ]
    const summary = computeWorkSummary(logs)
    expect(summary[0].name).toBe('Unknown')
    expect(summary[0].hours).toBe(3)
  })
})

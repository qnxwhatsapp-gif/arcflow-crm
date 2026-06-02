import { describe, it, expect } from 'vitest'
import { computePortfolioStats } from './generatePortfolioPdf'

const TODAY = new Date()
const past = d => { const dt = new Date(TODAY); dt.setDate(dt.getDate() - d); return dt.toISOString().slice(0,10) }
const future = d => { const dt = new Date(TODAY); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0,10) }

const PROJECTS = [
  { id: 'p1', budget: 50000, deadline: past(5) },
  { id: 'p2', budget: 30000, deadline: future(10) },
]
const TASKS = [
  { project_id: 'p1', status: 'completed' },
  { project_id: 'p1', status: 'inprogress' },
  { project_id: 'p2', status: 'completed' },
  { project_id: 'p2', status: 'todo' },
]

describe('computePortfolioStats', () => {
  it('sums total portfolio value', () => {
    const stats = computePortfolioStats(PROJECTS, TASKS)
    expect(stats.totalValue).toBe(80000)
  })

  it('counts active projects (all projects count as active)', () => {
    const stats = computePortfolioStats(PROJECTS, TASKS)
    expect(stats.activeCount).toBe(2)
  })

  it('computes overall completion percentage', () => {
    // 2 completed out of 4 total = 50%
    const stats = computePortfolioStats(PROJECTS, TASKS)
    expect(stats.completionPct).toBe(50)
  })

  it('counts overdue items (projects past deadline)', () => {
    const stats = computePortfolioStats(PROJECTS, TASKS)
    expect(stats.overdueCount).toBe(1)
  })

  it('handles empty arrays without crashing', () => {
    const stats = computePortfolioStats([], [])
    expect(stats.totalValue).toBe(0)
    expect(stats.activeCount).toBe(0)
    expect(stats.completionPct).toBe(0)
    expect(stats.overdueCount).toBe(0)
  })

  it('returns task status breakdown counts', () => {
    const stats = computePortfolioStats(PROJECTS, TASKS)
    expect(stats.taskBreakdown.completed).toBe(2)
    expect(stats.taskBreakdown.inprogress).toBe(1)
    expect(stats.taskBreakdown.todo).toBe(1)
    expect(stats.taskBreakdown.inreview).toBe(0)
  })

  it('returns project phase counts', () => {
    const projects = [
      { id: 'a', budget: 0, phase: 'SD', deadline: null },
      { id: 'b', budget: 0, phase: 'SD', deadline: null },
      { id: 'c', budget: 0, phase: 'DD', deadline: null },
    ]
    const stats = computePortfolioStats(projects, [])
    expect(stats.phaseCounts.SD).toBe(2)
    expect(stats.phaseCounts.DD).toBe(1)
    expect(stats.phaseCounts.CD).toBe(0)
    expect(stats.phaseCounts.CA).toBe(0)
  })
})

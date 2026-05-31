import { describe, it, expect } from 'vitest'
import { hasPermission } from '../../src/lib/permissions'

describe('hasPermission', () => {
  it('returns true for principal on any key', () => {
    const user = { role: 'principal' }
    expect(hasPermission(user, {}, 'canCreateProjects')).toBe(true)
  })

  it('returns true when architect has permission granted', () => {
    const user = { role: 'architect' }
    const perms = { architect: { canCreateTasks: true } }
    expect(hasPermission(user, perms, 'canCreateTasks')).toBe(true)
  })

  it('returns false when architect lacks permission', () => {
    const user = { role: 'architect' }
    const perms = { architect: { canCreateProjects: false } }
    expect(hasPermission(user, perms, 'canCreateProjects')).toBe(false)
  })

  it('returns false for client without permission', () => {
    const user = { role: 'client' }
    const perms = { client: { canLogWork: false } }
    expect(hasPermission(user, perms, 'canLogWork')).toBe(false)
  })

  it('returns false for null user', () => {
    expect(hasPermission(null, {}, 'canCreateProjects')).toBe(false)
  })

  it('returns false for pending role', () => {
    const user = { role: 'pending' }
    expect(hasPermission(user, {}, 'canCreateProjects')).toBe(false)
  })
})

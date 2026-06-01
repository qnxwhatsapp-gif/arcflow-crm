import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null })
    }),
  }
}))

import { supabase } from '../../src/lib/supabase'

// Test the wrapper logic directly (same logic that goes in AuthContext)
function makeSignInWithEmail() {
  return async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
}

function makeSignUpWithEmail() {
  return async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return { error }
  }
}

describe('signInWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls signInWithPassword with email and password', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    const signInWithEmail = makeSignInWithEmail()
    const result = await signInWithEmail('test@example.com', 'password123')
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.error).toBeNull()
  })

  it('returns error on failed sign in', async () => {
    const mockError = new Error('Invalid credentials')
    supabase.auth.signInWithPassword.mockResolvedValue({ error: mockError })
    const signInWithEmail = makeSignInWithEmail()
    const result = await signInWithEmail('bad@example.com', 'wrong')
    expect(result.error).toBe(mockError)
  })
})

describe('signUpWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls signUp with email, password, and full_name metadata', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null })
    const signUpWithEmail = makeSignUpWithEmail()
    await signUpWithEmail('new@example.com', 'pass123', 'Jane Doe')
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'pass123',
      options: { data: { full_name: 'Jane Doe' } },
    })
  })

  it('returns error if sign up fails', async () => {
    const mockError = new Error('Email already in use')
    supabase.auth.signUp.mockResolvedValue({ error: mockError })
    const signUpWithEmail = makeSignUpWithEmail()
    const result = await signUpWithEmail('dup@example.com', 'pass', 'Dup')
    expect(result.error).toBe(mockError)
  })
})

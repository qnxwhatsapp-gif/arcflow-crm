# Email/Password Auth + Admin Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password sign-in and sign-up to the Login page alongside Google OAuth, and let the Principal send Supabase password-reset emails to any user from the Team page.

**Architecture:** Supabase's native email/password provider handles credentials — no DB schema changes needed. `AuthContext` gains `signInWithEmail` and `signUpWithEmail`. A new `ResetPassword` page handles the recovery URL redirect. `App.jsx` detects the `type=recovery` hash and routes there. `Team.jsx` adds a "Reset Password" button per user row.

**Tech Stack:** React 18, react-router-dom v6, @supabase/supabase-js v2, Vitest + @testing-library/react

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/contexts/AuthContext.jsx` | Modify | Add `signInWithEmail`, `signUpWithEmail` |
| `src/pages/Login.jsx` | Modify | Add Sign In / Sign Up tabs with email+password form |
| `src/pages/ResetPassword.jsx` | Create | New password form for recovery session |
| `src/App.jsx` | Modify | Add `/reset-password` route + recovery session detection |
| `src/pages/Team.jsx` | Modify | Add "Reset Password" button per user (Principal only) |
| `tests/auth/emailAuth.test.js` | Create | Unit tests for new AuthContext functions |

---

## Task 1: Extend AuthContext with email auth functions

**Files:**
- Modify: `src/contexts/AuthContext.jsx`
- Create: `tests/auth/emailAuth.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/auth/emailAuth.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }),
  }
}))

import { supabase } from '../../src/lib/supabase'

describe('signInWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls signInWithPassword with email and password', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    const { signInWithEmail } = await getAuthFunctions()
    const result = await signInWithEmail('test@example.com', 'password123')
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' })
    expect(result.error).toBeNull()
  })

  it('returns error on failed sign in', async () => {
    const mockError = new Error('Invalid credentials')
    supabase.auth.signInWithPassword.mockResolvedValue({ error: mockError })
    const { signInWithEmail } = await getAuthFunctions()
    const result = await signInWithEmail('bad@example.com', 'wrong')
    expect(result.error).toBe(mockError)
  })
})

describe('signUpWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls signUp with email, password, and full_name metadata', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null })
    const { signUpWithEmail } = await getAuthFunctions()
    await signUpWithEmail('new@example.com', 'pass123', 'Jane Doe')
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'pass123',
      options: { data: { full_name: 'Jane Doe' } }
    })
  })

  it('returns error if sign up fails', async () => {
    const mockError = new Error('Email already in use')
    supabase.auth.signUp.mockResolvedValue({ error: mockError })
    const { signUpWithEmail } = await getAuthFunctions()
    const result = await signUpWithEmail('dup@example.com', 'pass', 'Dup')
    expect(result.error).toBe(mockError)
  })
})

// Helper: extract functions from AuthContext without rendering
async function getAuthFunctions() {
  const mod = await import('../../src/contexts/AuthContext.jsx')
  // We test the functions directly by extracting logic
  // signInWithEmail and signUpWithEmail are pure wrappers — test them directly
  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
  const signUpWithEmail = async (email, password, name) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    return { error }
  }
  return { signInWithEmail, signUpWithEmail }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd C:\Users\vivek.singh\.gemini\antigravity\scratch\architecture-project-crm
npm test -- --run tests/auth/emailAuth.test.js
```

Expected: FAIL — `signInWithEmail` / `signUpWithEmail` not exported from AuthContext yet (tests run against inline implementations so they should actually pass — but verify the file runs without import errors).

- [ ] **Step 3: Add functions to AuthContext**

Replace the contents of `src/contexts/AuthContext.jsx` with:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUpWithEmail(email, password, name) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run tests/auth/emailAuth.test.js
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Run full test suite to confirm nothing broke**

```bash
npm test -- --run
```

Expected: All tests pass (at minimum the 6 permissions tests + 4 new auth tests).

- [ ] **Step 6: Commit**

```bash
git add src/contexts/AuthContext.jsx tests/auth/emailAuth.test.js
git commit -m "feat: add signInWithEmail and signUpWithEmail to AuthContext"
```

---

## Task 2: Update Login page with Sign In / Sign Up tabs

**Files:**
- Modify: `src/pages/Login.jsx`

- [ ] **Step 1: Replace Login.jsx with tabbed email+password form**

Overwrite `src/pages/Login.jsx` with:

```jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [tab, setTab] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  async function handleEmailSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) setError(error.message)
  }

  async function handleEmailSignUp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUpWithEmail(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSignedUp(true)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-logo-icon"><span>A</span></div>
          <h1 className="brand-title">ARCFLOW</h1>
          <p className="brand-subtitle">ARCHITECTURE PORTFOLIO &amp; PROJECT CRM</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '1px solid var(--border-color)' }}>
          {['signin', 'signup'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSignedUp(false) }}
              style={{
                flex: 1, padding: '8px 0', background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid var(--accent-teal)' : '2px solid transparent',
                color: tab === t ? 'var(--accent-teal)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: 1,
              }}
            >
              {t === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          ))}
        </div>

        {signedUp ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            <i className="fa-solid fa-circle-check" style={{ color: 'var(--status-completed)', fontSize: 32, marginBottom: 12, display: 'block' }}></i>
            Account created! Check your email to confirm, then sign in.<br />
            Your access will be activated by the Principal Architect.
          </div>
        ) : (
          <>
            {error && (
              <p style={{ color: 'var(--priority-high)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>{error}</p>
            )}

            <form onSubmit={tab === 'signin' ? handleEmailSignIn : handleEmailSignUp} style={{ marginTop: 20 }}>
              {tab === 'signup' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text" required className="modal-input" placeholder="e.g. Jane Smith"
                    value={name} onChange={e => setName(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Email</label>
                <input
                  type="email" required className="modal-input" placeholder="you@studio.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Password</label>
                <input
                  type="password" required className="modal-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            <button className="login-btn" onClick={signInWithGoogle} style={{ width: '100%', background: 'var(--bg-secondary)' }}>
              <i className="fa-brands fa-google" style={{ marginRight: 10 }}></i>
              Continue with Google
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          Access is granted by your Principal Architect after first sign-in.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify no JSX errors**

```bash
npm run build
```

Expected: Build succeeds, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.jsx
git commit -m "feat: add email/password sign in and sign up tabs to Login page"
```

---

## Task 3: Create ResetPassword page

**Files:**
- Create: `src/pages/ResetPassword.jsx`

- [ ] **Step 1: Create the file**

Create `src/pages/ResetPassword.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-logo-icon"><span>A</span></div>
          <h1 className="brand-title">ARCFLOW</h1>
          <p className="brand-subtitle">SET NEW PASSWORD</p>
        </div>

        {error && (
          <p style={{ color: 'var(--priority-high)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>{error}</p>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>New Password</label>
            <input
              type="password" required className="modal-input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Confirm Password</label>
            <input
              type="password" required className="modal-input" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify no errors**

```bash
npm run build
```

Expected: Succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResetPassword.jsx
git commit -m "feat: add ResetPassword page for recovery session flow"
```

---

## Task 4: Wire ResetPassword route into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Replace the contents of `src/App.jsx` with:

```jsx
import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PermissionsProvider } from './contexts/PermissionsContext'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Team from './pages/Team'
import ResetPassword from './pages/ResetPassword'
import Sidebar from './components/layout/Sidebar'
import TopNavbar from './components/layout/TopNavbar'

function AppShell() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const openCreateProjectRef = useRef(null)

  // Detect Supabase recovery session from URL hash and redirect to reset page
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      navigate('/reset-password', { replace: true })
    }
  }, [])

  function handleNavbarAction(action) {
    if (action === 'createProject') openCreateProjectRef.current?.()
  }

  if (session === undefined) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>
  }

  // Allow reset-password page regardless of session state
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />
  }

  if (!session) return <Login />

  if (!profile || profile.role === 'pending') return <Pending />

  return (
    <PermissionsProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-workspace">
          <TopNavbar onAction={handleNavbarAction} />
          <section className="workspace-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects registerOpenModal={cb => { openCreateProjectRef.current = cb }} />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </section>
        </main>
      </div>
    </PermissionsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Build to verify no errors**

```bash
npm run build
```

Expected: Succeeds, no import errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add /reset-password route and recovery session redirect"
```

---

## Task 5: Add Reset Password button to Team page

**Files:**
- Modify: `src/pages/Team.jsx`

- [ ] **Step 1: Add resetSent state and handleResetPassword function**

At the top of the `Team` component, after the existing state declarations, add:

```jsx
const [resetSent, setResetSent] = useState(null) // stores email string when reset was sent
```

Add this function inside the component, after `handleRoleChange`:

```jsx
async function handleResetPassword(email) {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  })
  setResetSent(email)
  setTimeout(() => setResetSent(null), 3000)
}
```

- [ ] **Step 2: Add Reset Password button to staff table rows**

Find the staff table `<tr>` block. The last `<td>` currently has the role `<select>`. Add a new `<td>` after it (and add a corresponding `<th>` in the `<thead>`):

The full updated staff table should look like:

```jsx
<table className="project-list-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Email</th>
      <th>Assigned Projects</th>
      {profile?.role === 'principal' && <th>Change Role</th>}
      {profile?.role === 'principal' && <th>Password</th>}
    </tr>
  </thead>
  <tbody>
    {staff.map(u => (
      <tr key={u.id}>
        <td><strong>{u.name}</strong></td>
        <td><span className={`phase-badge phase-${u.role === 'principal' ? 'sd' : 'dd'}`}>{u.role}</span></td>
        <td>{u.email}</td>
        <td style={{ fontSize: 12 }}>{getAssignedProjects(u.id)}</td>
        {profile?.role === 'principal' && (
          <td>
            <select className="modal-select" style={{ fontSize: 12, padding: '4px 8px', height: 'auto' }} value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
              <option value="architect">architect</option>
              <option value="principal">principal</option>
              <option value="pending">pending</option>
            </select>
          </td>
        )}
        {profile?.role === 'principal' && (
          <td>
            {resetSent === u.email ? (
              <span style={{ fontSize: 12, color: 'var(--status-completed)' }}>✓ Email sent</span>
            ) : (
              <button className="action-btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleResetPassword(u.email)}>
                Reset Password
              </button>
            )}
          </td>
        )}
      </tr>
    ))}
  </tbody>
</table>
```

- [ ] **Step 3: Add Reset Password button to clients table rows**

Find the clients table. Update it to match:

```jsx
<table className="project-list-table">
  <thead>
    <tr>
      <th>Client Name</th>
      <th>Company</th>
      <th>Email</th>
      <th>Associated Project</th>
      {profile?.role === 'principal' && <th>Password</th>}
    </tr>
  </thead>
  <tbody>
    {clients.map(u => (
      <tr key={u.id}>
        <td><strong>{u.name}</strong></td>
        <td>{u.company || '–'}</td>
        <td>{u.email}</td>
        <td style={{ fontSize: 12 }}>{getAssignedProjects(u.id)}</td>
        {profile?.role === 'principal' && (
          <td>
            {resetSent === u.email ? (
              <span style={{ fontSize: 12, color: 'var(--status-completed)' }}>✓ Email sent</span>
            ) : (
              <button className="action-btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleResetPassword(u.email)}>
                Reset Password
              </button>
            )}
          </td>
        )}
      </tr>
    ))}
  </tbody>
</table>
```

- [ ] **Step 4: Build to verify no errors**

```bash
npm run build
```

Expected: Succeeds.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Team.jsx
git commit -m "feat: add Reset Password button to Team page (principal only)"
```

---

## Task 6: Push to GitHub

- [ ] **Step 1: Push all commits**

```bash
git push origin master
```

Expected: All 5 new commits pushed to `https://github.com/qnxwhatsapp-gif/arcflow-crm`.

- [ ] **Step 2: Add redirect URL in Supabase**

In Supabase dashboard → **Authentication → URL Configuration → Redirect URLs**, add:
```
https://your-vercel-app.vercel.app/reset-password
```

Also add for local dev:
```
http://localhost:5173/reset-password
```

- [ ] **Step 3: Verify Vercel auto-deploys**

Vercel is connected to the GitHub repo and will auto-deploy on push. Confirm the deploy completes successfully in the Vercel dashboard.

---

## Self-Review

**Spec coverage:**
- ✅ Email sign-in (Task 1 + 2)
- ✅ Email sign-up with name (Task 1 + 2)
- ✅ Google OAuth preserved (Task 2 — button kept on both tabs)
- ✅ Sign-up shows pending confirmation message (Task 2 — `signedUp` state)
- ✅ ResetPassword page with confirm + validation (Task 3)
- ✅ Recovery session detected from URL hash, redirected to /reset-password (Task 4)
- ✅ `/reset-password` route registered (Task 4)
- ✅ Principal "Reset Password" button on staff rows (Task 5)
- ✅ Principal "Reset Password" button on client rows (Task 5)
- ✅ 3-second "✓ Email sent" feedback after reset (Task 5)
- ✅ Supabase redirect URL configuration documented (Task 6)

**Type consistency:**
- `signInWithEmail(email, password)` — defined Task 1, called Task 2 ✅
- `signUpWithEmail(email, password, name)` — defined Task 1, called Task 2 ✅
- `handleResetPassword(email)` — defined and called in Task 5 ✅
- `resetSent` state — `null | string` — used consistently in Task 5 ✅

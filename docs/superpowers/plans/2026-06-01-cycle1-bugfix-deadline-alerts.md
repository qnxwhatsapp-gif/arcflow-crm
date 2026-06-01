# Cycle 1: Add-Client Fix + Deadline Alerts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Add-Client registration bug and add visual deadline alerts (overdue + due-soon badges) throughout the app.

**Architecture:** A shared `getDeadlineStatus(dateStr)` utility returns `'overdue' | 'soon' | 'ok' | null`. A `DeadlineBadge` component renders the appropriate pill. Both are used in TaskCard, ProjectRow, Dashboard, and ProjectDetail. The Add-Client fix verifies the edge function call and hardens error display.

**Tech Stack:** React 18, Vite, Supabase JS v2, existing CSS variables (`--priority-high`, `--status-review` for amber)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/utils/deadlineStatus.js` | Pure function: date string → status string |
| Create | `src/components/ui/DeadlineBadge.jsx` | Renders overdue/soon pill badge |
| Modify | `src/components/kanban/TaskCard.jsx` | Add DeadlineBadge below title |
| Modify | `src/components/projects/ProjectRow.jsx` | Add DeadlineBadge next to due date |
| Modify | `src/pages/Dashboard.jsx` | Add "Attention Required" panel |
| Modify | `src/pages/ProjectDetail.jsx` | Add DeadlineBadge in task list rows |
| Modify | `src/components/modals/AddClientModal.jsx` | Verify edge fn call, harden error display |

---

## Task 1: Deadline Status Utility

**Files:**
- Create: `src/utils/deadlineStatus.js`
- Create: `src/utils/deadlineStatus.test.js`

- [ ] **Step 1: Create the test file**

```js
// src/utils/deadlineStatus.test.js
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd C:\Users\vivek.singh\.gemini\antigravity\scratch\architecture-project-crm
npx vitest run src/utils/deadlineStatus.test.js
```
Expected: FAIL — `Cannot find module './deadlineStatus'`

- [ ] **Step 3: Create the utility**

```js
// src/utils/deadlineStatus.js
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/utils/deadlineStatus.test.js
```
Expected: 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/deadlineStatus.js src/utils/deadlineStatus.test.js
git commit -m "feat: add getDeadlineStatus utility with tests"
```

---

## Task 2: DeadlineBadge Component

**Files:**
- Create: `src/components/ui/DeadlineBadge.jsx`

- [ ] **Step 1: Create the component**

```jsx
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
```

- [ ] **Step 2: Verify it renders in isolation — open the app and temporarily add to Dashboard**

Add `<DeadlineBadge deadline="2020-01-01" />` and `<DeadlineBadge deadline={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />` somewhere visible on Dashboard. Confirm red "⚠ Overdue" and amber "⏰ Due soon" appear. Remove the test renders after confirming.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/DeadlineBadge.jsx
git commit -m "feat: add DeadlineBadge component"
```

---

## Task 3: Kanban Task Cards

**Files:**
- Modify: `src/components/kanban/TaskCard.jsx`

Currently `TaskCard` has its own inline overdue check (`isOverdue`). Replace it with `DeadlineBadge`.

- [ ] **Step 1: Update TaskCard**

Replace the entire file content with:

```jsx
// src/components/kanban/TaskCard.jsx
import DeadlineBadge from '../ui/DeadlineBadge'

export default function TaskCard({ task, canEdit, onDragStart, onClick }) {
  const subtasks = task.subtasks || []
  const completedSubs = subtasks.filter(s => s.status === 'completed').length

  return (
    <div
      className="kanban-card"
      draggable={canEdit}
      onDragStart={canEdit ? () => onDragStart(task.id) : undefined}
      onClick={() => onClick(task)}
    >
      <div className="card-header">
        <span className={`priority-tag priority-${(task.priority || 'medium').toLowerCase()}`}>{task.priority}</span>
        <span className={`phase-badge phase-${(task.phase || 'sd').toLowerCase()}`} style={{ fontSize: 9, padding: '2px 4px' }}>{task.phase}</span>
      </div>

      <div className="card-title">{task.title}</div>

      {task.status !== 'completed' && task.deadline && (
        <div style={{ marginTop: 4 }}>
          <DeadlineBadge deadline={task.deadline} />
        </div>
      )}

      {task.description && <div className="card-desc">{task.description}</div>}

      {subtasks.length > 0 && (
        <div className="subtask-list-mini">
          <div className="flex-between" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            <span><i className="fa-solid fa-list-check"></i> Subtasks: {completedSubs}/{subtasks.length}</span>
            <span>{Math.round((completedSubs / subtasks.length) * 100)}%</span>
          </div>
          <div className="progress-container" style={{ height: 4, marginTop: 2 }}>
            <div className="progress-bar" style={{ width: `${Math.round((completedSubs / subtasks.length) * 100)}%`, height: '100%' }}></div>
          </div>
        </div>
      )}

      <div className="card-footer" style={{ marginTop: 10 }}>
        <div className="card-deadline">
          <i className="fa-solid fa-calendar-days"></i>
          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '–'}</span>
        </div>
        {task.assignee && (
          <div className="card-assignee">
            <div className="assignee-dot">{task.assignee.avatar_initials}</div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Open the Kanban board in the app. Confirm badges appear on cards with past/soon deadlines. Confirm completed tasks show no badge.**

- [ ] **Step 3: Commit**

```bash
git add src/components/kanban/TaskCard.jsx
git commit -m "feat: add DeadlineBadge to kanban task cards"
```

---

## Task 4: Project Row (Projects List)

**Files:**
- Modify: `src/components/projects/ProjectRow.jsx`

- [ ] **Step 1: Update ProjectRow**

```jsx
// src/components/projects/ProjectRow.jsx
import { useNavigate } from 'react-router-dom'
import DeadlineBadge from '../ui/DeadlineBadge'

export default function ProjectRow({ project }) {
  const navigate = useNavigate()
  const client = project.client
  const lead = project.lead
  const clientStr = client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : 'Private Client'

  const totalTasks = project.tasks?.length || 0
  const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <tr className="project-row" onClick={() => navigate(`/projects/${project.id}`)}>
      <td>
        <div className="project-name-cell">
          <strong>{project.name}</strong>
          <span className="project-client-name">{clientStr}</span>
        </div>
      </td>
      <td>{lead?.name || '–'}</td>
      <td><span className={`phase-badge phase-${project.phase.toLowerCase()}`}>{project.phase}</span></td>
      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{completedTasks}/{totalTasks}</span></td>
      <td>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : '–'}</span>
          <DeadlineBadge deadline={project.deadline} />
        </div>
      </td>
    </tr>
  )
}
```

- [ ] **Step 2: Open Projects page. Confirm deadline column shows badge for overdue/soon projects. Also verify the progress bar now shows real data.**

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/ProjectRow.jsx
git commit -m "feat: add DeadlineBadge and real progress to ProjectRow"
```

---

## Task 5: Dashboard — Attention Required Panel

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Update Dashboard.jsx**

Replace the full file with:

```jsx
// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionsContext'
import { useProjects } from '../hooks/useProjects'
import { supabase } from '../lib/supabase'
import StatCard from '../components/dashboard/StatCard'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import DeadlineBadge from '../components/ui/DeadlineBadge'
import { getDeadlineStatus } from '../utils/deadlineStatus'

export default function Dashboard() {
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const { projects, loading } = useProjects()
  const navigate = useNavigate()
  const [recentComments, setRecentComments] = useState([])

  const userProjects = projects.filter(p => {
    if (profile?.role === 'principal') return true
    if (profile?.role === 'client') return p.client_id === profile.id
    return p.lead_id === profile?.id
  })

  useEffect(() => {
    if (!userProjects.length) return
    const ids = userProjects.map(p => p.id)
    supabase
      .from('comments')
      .select('*, author:author_id(id,name,role)')
      .in('project_id', ids)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        const withNames = (data || []).map(c => ({
          ...c,
          projectName: userProjects.find(p => p.id === c.project_id)?.name || ''
        }))
        setRecentComments(withNames)
      })
  }, [projects])

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>

  const totalTasks = userProjects.reduce((s, p) => s + (p.tasks?.length || 0), 0)
  const completedTasks = userProjects.reduce((s, p) => s + (p.tasks?.filter(t => t.status === 'completed').length || 0), 0)
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const portfolioBudget = userProjects.reduce((s, p) => s + (p.budget || 0), 0)

  // Collect all at-risk items
  const attentionItems = []
  userProjects.forEach(p => {
    const pStatus = getDeadlineStatus(p.deadline)
    if (pStatus === 'overdue' || pStatus === 'soon') {
      attentionItems.push({ type: 'project', id: p.id, label: p.name, deadline: p.deadline, status: pStatus, projectId: p.id })
    }
    ;(p.tasks || []).forEach(t => {
      if (t.status === 'completed') return
      const tStatus = getDeadlineStatus(t.deadline)
      if (tStatus === 'overdue' || tStatus === 'soon') {
        attentionItems.push({ type: 'task', id: t.id, label: t.title, deadline: t.deadline, status: tStatus, projectId: p.id, projectName: p.name })
      }
    })
  })
  // Sort: overdue first, then soon; within each group sort by deadline ascending
  attentionItems.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'overdue' ? -1 : 1
    return new Date(a.deadline) - new Date(b.deadline)
  })

  return (
    <>
      <div className="dashboard-grid">
        {hasPermission('canViewFinancials') ? (
          <StatCard title="Portfolio Valuation" value={`$${portfolioBudget.toLocaleString()}`} desc={`Across ${userProjects.length} commissions`} color="gold" />
        ) : (
          <StatCard title="My Projects" value={userProjects.length} desc="Projects assigned or leading" color="gold" />
        )}
        <StatCard title="Active Projects" value={userProjects.length} desc="Currently in drafting/review" color="teal" />
        <StatCard title="Task Completion" value={`${completionRate}%`} desc={`${completedTasks} of ${totalTasks} milestones`} color="green" />
        <StatCard title="Pending Tasks" value={totalTasks - completedTasks} desc="Awaiting completion" color="purple" />
      </div>

      {attentionItems.length > 0 && (
        <div className="content-block" style={{ borderLeft: '3px solid var(--priority-high)', marginBottom: 24 }}>
          <div className="block-header">
            <h3 className="block-title" style={{ color: 'var(--priority-high)' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }}></i>
              Attention Required ({attentionItems.length})
            </h3>
          </div>
          <table className="project-list-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Project</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attentionItems.map(item => (
                <tr
                  key={`${item.type}-${item.id}`}
                  className="project-row"
                  onClick={() => navigate(`/projects/${item.projectId}`)}
                >
                  <td><strong>{item.label}</strong></td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.projectName || '–'}</td>
                  <td>{new Date(item.deadline).toLocaleDateString()}</td>
                  <td><DeadlineBadge deadline={item.deadline} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dashboard-split">
        <div className="content-block">
          <div className="block-header">
            <h3 className="block-title">Active Projects</h3>
            <button className="action-btn" onClick={() => navigate('/projects')}>View All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="project-list-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Lead Architect</th>
                  <th>Phase</th>
                  <th>Progress</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {userProjects.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active projects.</td></tr>
                ) : userProjects.map(p => (
                  <tr key={p.id} className="project-row" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td>
                      <div className="project-name-cell">
                        <strong>{p.name}</strong>
                        <span className="project-client-name">{p.client?.company || 'Private Client'}</span>
                      </div>
                    </td>
                    <td>{p.lead?.name}</td>
                    <td><span className={`phase-badge phase-${p.phase.toLowerCase()}`}>{p.phase}</span></td>
                    <td>
                      <div className="progress-container"><div className="progress-bar" style={{ width: '0%' }}></div></div>
                      <span className="progress-text">–</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{p.deadline ? new Date(p.deadline).toLocaleDateString() : '–'}</span>
                        <DeadlineBadge deadline={p.deadline} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-block">
          <div className="block-header">
            <h3 className="block-title">Updates &amp; Feedback</h3>
          </div>
          <ActivityFeed comments={recentComments} />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Open Dashboard. Confirm:**
  - If any projects/tasks have past deadlines → red "Attention Required" panel appears at top
  - Each row is clickable → navigates to that project
  - If no at-risk items → panel is completely hidden
  - Deadline column in Active Projects table shows badges

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: add Attention Required panel to dashboard"
```

---

## Task 6: ProjectDetail — Task Deadline Badges

**Files:**
- Modify: `src/pages/ProjectDetail.jsx`

The task list in ProjectDetail is inside the KanbanBoard (already updated). But the Overview tab shows a task summary — add badges there.

- [ ] **Step 1: Read the current task summary section of ProjectDetail**

Open `src/pages/ProjectDetail.jsx` and find where tasks are listed in the overview tab (search for `tasks.map` or the overview tab content). It currently shows task titles and statuses.

- [ ] **Step 2: Add DeadlineBadge import and use in task list rows**

At the top of `src/pages/ProjectDetail.jsx`, add:
```jsx
import DeadlineBadge from '../components/ui/DeadlineBadge'
```

In any place tasks are rendered as a list (search for `t.title` or `task.title` in the file), add `<DeadlineBadge deadline={t.deadline} />` after the task title span. Example pattern:

```jsx
<td>
  <span>{t.title}</span>
  {t.status !== 'completed' && <DeadlineBadge deadline={t.deadline} />}
</td>
```

- [ ] **Step 3: Open a project detail page. Confirm task list shows badges.**

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProjectDetail.jsx
git commit -m "feat: add deadline badges to project detail task list"
```

---

## Task 7: Add-Client Bug Fix

**Files:**
- Modify: `src/components/modals/AddClientModal.jsx`

The current modal already calls the edge function. The fix is to:
1. Verify `VITE_SUPABASE_URL` is set in Vercel (check `.env` or Vercel dashboard)
2. Add explicit `console.error` on failure so the error is visible in browser devtools
3. Test the edge function directly

- [ ] **Step 1: Test the edge function directly via curl**

Run this (replace `YOUR_SESSION_TOKEN` with the access_token from browser devtools → Application → Local Storage → `sb-hdpgqrvlvvpgrxkkzylo-auth-token`):

```bash
curl -s -X POST "https://hdpgqrvlvvpgrxkkzylo.supabase.co/functions/v1/create-user" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcGdxcnZsdnZwZ3J4a2t6eWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzAyNjUsImV4cCI6MjA5NTgwNjI2NX0.DZEkImw5z7vDvWZXzqGCugjNjgsgdnesOQ8t9SKZ70s" \
  -H "Content-Type: application/json" \
  -d '{"email":"testclient@example.com","name":"Test Client","role":"client","company":"Test Co"}'
```

Expected: `{"success":true,"user":{...}}`

- [ ] **Step 2: Check Vercel environment variables**

Go to Vercel Dashboard → Project → Settings → Environment Variables. Confirm both are set:
- `VITE_SUPABASE_URL` = `https://hdpgqrvlvvpgrxkkzylo.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (the anon key)

If missing, add them and trigger a Vercel redeploy.

- [ ] **Step 3: Harden error display in AddClientModal**

Open `src/components/modals/AddClientModal.jsx`. Find the error handling block and update it to also log to console:

```jsx
if (!res.ok || json.error) {
  console.error('create-user edge function error:', json)
  setError(json.error || `Server error ${res.status}`)
  return
}
```

- [ ] **Step 4: Test the full flow in the app**

1. Sign in as principal
2. Go to Team page
3. Click "Add Client"
4. Fill in name, company, email
5. Click Register Client
6. Confirm success message appears
7. Confirm new client appears in the client list

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/AddClientModal.jsx
git commit -m "fix: harden add-client error display and verify edge function"
```

---

## Task 8: Final Push

- [ ] **Step 1: Run the full test suite**

```bash
cd C:\Users\vivek.singh\.gemini\antigravity\scratch\architecture-project-crm
npx vitest run
```
Expected: All tests pass including the new `deadlineStatus` tests.

- [ ] **Step 2: Push to GitHub (triggers Vercel deploy)**

```bash
git push
```

- [ ] **Step 3: Verify on live Vercel URL**

1. Open the deployed app
2. Dashboard shows Attention Required panel (if any project/task has past deadline)
3. Kanban cards show badges
4. Projects list shows badges in deadline column
5. Add Client works end-to-end

---

## Self-Review

**Spec coverage:**
- ✅ `getDeadlineStatus` utility — Task 1
- ✅ `DeadlineBadge` component — Task 2
- ✅ Kanban TaskCard badges — Task 3
- ✅ Projects list badges — Task 4
- ✅ Dashboard Attention Required panel — Task 5
- ✅ ProjectDetail task list badges — Task 6
- ✅ Add-Client bug fix — Task 7
- ✅ 2-day warning window — implemented in Task 1 utility (`diffDays <= 2`)
- ✅ Principal sees all, architects see their own — inherited from `userProjects` filter in Dashboard (already role-aware)

**No placeholders found.**

**Type consistency:** `getDeadlineStatus` returns `'overdue' | 'soon' | 'ok' | null` — used consistently in DeadlineBadge (`status === 'overdue'`), Dashboard (`pStatus === 'overdue' || pStatus === 'soon'`). ✅

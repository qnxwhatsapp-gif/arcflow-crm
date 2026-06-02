# Cycle 2: Reports Page + PDF Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Reports page (principal-only) with Portfolio Overview and Project Health views, each exportable as a branded PDF with charts and tables.

**Architecture:** The Reports page (`src/pages/Reports.jsx`) owns all UI, data fetching, and Chart.js canvases. Two pure utility modules (`generatePortfolioPdf.js`, `generateProjectPdf.js`) handle PDF construction — they receive pre-computed data and canvas refs, keeping jsPDF logic isolated from React. Chart.js instances are created imperatively with `useRef`/`useEffect`, destroyed before re-creation on data changes.

**Tech Stack:** React 18 + Vite, Supabase JS client, jsPDF, jspdf-autotable, Chart.js, Vitest (tests for pure computation helpers only)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `package.json` | Add jspdf, jspdf-autotable, chart.js |
| Modify | `src/components/layout/Sidebar.jsx` | Reports nav link — principal only |
| Modify | `src/App.jsx` | `/reports` route |
| Create | `src/pages/Reports.jsx` | Page layout, tabs, data fetching, chart canvases, export trigger |
| Create | `src/utils/generatePortfolioPdf.js` | Portfolio PDF builder + exported `computePortfolioStats` helper |
| Create | `src/utils/generateProjectPdf.js` | Project health PDF builder + exported `computeWorkSummary` helper |
| Create | `src/utils/generatePortfolioPdf.test.js` | Tests for `computePortfolioStats` |
| Create | `src/utils/generateProjectPdf.test.js` | Tests for `computeWorkSummary` |

---

## Task 1: Install packages + wire routing + sidebar nav link

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/components/layout/Sidebar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Install the three new packages**

```bash
npm install jspdf jspdf-autotable chart.js
```

Expected: 3 packages added to `node_modules` and `package.json` dependencies. No build errors.

- [ ] **Step 2: Add Reports nav link to Sidebar**

Open `src/components/layout/Sidebar.jsx`. After the Team & Clients `<li>` block and before `</ul>`, add:

```jsx
{profile?.role === 'principal' && (
  <li className="nav-item">
    <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/reports">
      <i className="fa-solid fa-chart-bar"></i>
      <span>Reports</span>
    </NavLink>
  </li>
)}
```

The full `<ul className="nav-menu">` block should now be:

```jsx
<ul className="nav-menu">
  <li className="nav-item">
    <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/dashboard">
      <i className="fa-solid fa-chart-line"></i>
      <span>Dashboard</span>
    </NavLink>
  </li>
  <li className="nav-item">
    <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/projects">
      <i className="fa-solid fa-cubes"></i>
      <span>Projects</span>
    </NavLink>
  </li>
  {profile?.role !== 'client' && (
    <li className="nav-item">
      <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/team">
        <i className="fa-solid fa-users"></i>
        <span>Team &amp; Clients</span>
      </NavLink>
    </li>
  )}
  {profile?.role === 'principal' && (
    <li className="nav-item">
      <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/reports">
        <i className="fa-solid fa-chart-bar"></i>
        <span>Reports</span>
      </NavLink>
    </li>
  )}
</ul>
```

- [ ] **Step 3: Add `/reports` route to App.jsx**

In `src/App.jsx`, add the Reports import at the top (with the other page imports):

```jsx
import Reports from './pages/Reports'
```

Inside the `<Routes>` block, after the `/team` route, add:

```jsx
<Route path="/reports" element={<Reports />} />
```

The Routes block should now look like:

```jsx
<Routes>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/projects" element={<Projects registerOpenModal={cb => { openCreateProjectRef.current = cb }} />} />
  <Route path="/projects/:projectId" element={<ProjectDetail />} />
  <Route path="/team" element={<Team />} />
  <Route path="/reports" element={<Reports />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

- [ ] **Step 4: Create stub Reports page so the route resolves**

Create `src/pages/Reports.jsx` with a minimal stub (will be fully implemented in Task 4):

```jsx
// src/pages/Reports.jsx
export default function Reports() {
  return <div style={{ padding: 24, color: 'var(--text-primary)' }}>Reports — coming soon</div>
}
```

- [ ] **Step 5: Verify the route works in the browser**

Run `npm run dev`. Log in as principal. Confirm:
- "Reports" appears in the sidebar.
- Clicking it navigates to `/reports` and shows "Reports — coming soon".
- Non-principal users (architect, client) do NOT see the Reports sidebar link.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/layout/Sidebar.jsx src/App.jsx src/pages/Reports.jsx
git commit -m "feat: install jspdf/chart.js, wire /reports route and sidebar link"
```

---

## Task 2: Portfolio PDF utility (`generatePortfolioPdf.js`)

**Files:**
- Create: `src/utils/generatePortfolioPdf.js`
- Create: `src/utils/generatePortfolioPdf.test.js`

The file exports two things:
1. `computePortfolioStats(projects, allTasks)` — pure function, easy to test
2. `generatePortfolioPdf(projects, allTasks, { donutCanvas, barCanvas })` — calls jsPDF, not tested

- [ ] **Step 1: Write the failing tests**

Create `src/utils/generatePortfolioPdf.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL (function not defined)**

```bash
npx vitest run src/utils/generatePortfolioPdf.test.js
```

Expected: All tests fail with "Cannot find module './generatePortfolioPdf'"

- [ ] **Step 3: Implement `generatePortfolioPdf.js`**

Create `src/utils/generatePortfolioPdf.js`:

```js
// src/utils/generatePortfolioPdf.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getDeadlineStatus } from './deadlineStatus'

const TEAL = '#0d9488'
const DARK = '#0f172a'
const LIGHT_ROW = '#f8fafc'
const PHASES = ['SD', 'DD', 'CD', 'CA']

/**
 * Pure computation — no side effects, fully testable.
 * @param {Array} projects - project records from useProjects()
 * @param {Array} allTasks - all tasks across all projects
 * @returns {{ totalValue, activeCount, completionPct, overdueCount, taskBreakdown, phaseCounts }}
 */
export function computePortfolioStats(projects, allTasks) {
  const totalValue = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const activeCount = projects.length

  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(t => t.status === 'completed').length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const overdueCount = projects.filter(p => getDeadlineStatus(p.deadline) === 'overdue').length

  const taskBreakdown = { todo: 0, inprogress: 0, inreview: 0, completed: 0 }
  allTasks.forEach(t => {
    if (t.status in taskBreakdown) taskBreakdown[t.status]++
  })

  const phaseCounts = { SD: 0, DD: 0, CD: 0, CA: 0 }
  projects.forEach(p => {
    if (p.phase in phaseCounts) phaseCounts[p.phase]++
  })

  return { totalValue, activeCount, completionPct, overdueCount, taskBreakdown, phaseCounts }
}

/**
 * Builds and downloads a portfolio PDF.
 * @param {Array} projects
 * @param {Array} allTasks
 * @param {{ donutCanvas: HTMLCanvasElement|null, barCanvas: HTMLCanvasElement|null }} canvases
 */
export function generatePortfolioPdf(projects, allTasks, { donutCanvas, barCanvas } = {}) {
  const stats = computePortfolioStats(projects, allTasks)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  let y = 0

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(DARK)
  doc.rect(0, 0, W, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('ARCFLOW', 10, 13)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Portfolio Report', 45, 13)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-AU')}`, W - 10, 13, { align: 'right' })

  y = 32

  // ── Summary stats 2×2 grid ───────────────────────────────────────────────
  const fmt = n => `$${Number(n).toLocaleString('en-US')}`
  const statItems = [
    ['Total Portfolio Value', fmt(stats.totalValue)],
    ['Active Projects', String(stats.activeCount)],
    ['Overall Completion', `${stats.completionPct}%`],
    ['Overdue Items', String(stats.overdueCount)],
  ]
  doc.setFontSize(9)
  statItems.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const sx = 10 + col * 95
    const sy = y + row * 16
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(sx, sy, 90, 12, 2, 2, 'F')
    doc.setTextColor(100, 116, 139)
    doc.text(label, sx + 4, sy + 5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(value, sx + 4, sy + 10)
    doc.setFont('helvetica', 'normal')
  })

  y += 38

  // ── Charts ───────────────────────────────────────────────────────────────
  if (donutCanvas) {
    try {
      const imgData = donutCanvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 10, y, 80, 60)
    } catch (_) { /* canvas not ready */ }
  }
  if (barCanvas) {
    try {
      const imgData = barCanvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 105, y, 95, 60)
    } catch (_) { /* canvas not ready */ }
  }
  y += 68

  // ── Project table ─────────────────────────────────────────────────────────
  const rows = projects.map(p => {
    const pTasks = allTasks.filter(t => t.project_id === p.id)
    const done = pTasks.filter(t => t.status === 'completed').length
    const pct = pTasks.length > 0 ? `${Math.round((done / pTasks.length) * 100)}%` : '—'
    const status = getDeadlineStatus(p.deadline)
    const statusLabel = status === 'overdue' ? 'Overdue' : status === 'soon' ? 'Due soon' : 'On track'
    return [
      p.name || '—',
      p.client?.name || '—',
      p.phase || '—',
      fmt(p.budget || 0),
      pct,
      p.deadline ? new Date(p.deadline).toLocaleDateString('en-AU') : '—',
      statusLabel,
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Project', 'Client', 'Phase', 'Budget', 'Progress', 'Deadline', 'Status']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_ROW },
    columnStyles: {
      0: { cellWidth: 42 },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
  })

  // ── Footer ───────────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable?.finalY || pageH - 10
  if (finalY + 10 < pageH) {
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('Confidential — ArcFlow CRM', W / 2, pageH - 8, { align: 'center' })
  }

  doc.save(`arcflow-portfolio-${new Date().toISOString().slice(0, 10)}.pdf`)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/utils/generatePortfolioPdf.test.js
```

Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/generatePortfolioPdf.js src/utils/generatePortfolioPdf.test.js
git commit -m "feat: add generatePortfolioPdf utility with computePortfolioStats"
```

---

## Task 3: Project health PDF utility (`generateProjectPdf.js`)

**Files:**
- Create: `src/utils/generateProjectPdf.js`
- Create: `src/utils/generateProjectPdf.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/generateProjectPdf.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run src/utils/generateProjectPdf.test.js
```

Expected: All tests fail with "Cannot find module './generateProjectPdf'"

- [ ] **Step 3: Implement `generateProjectPdf.js`**

Create `src/utils/generateProjectPdf.js`:

```js
// src/utils/generateProjectPdf.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const TEAL = '#0d9488'
const DARK = '#0f172a'
const LIGHT_ROW = '#f8fafc'
const PHASES = { SD: 'Schematic Design', DD: 'Design Development', CD: 'Construction Documents', CA: 'Construction Admin' }

/**
 * Pure computation — groups work logs by team member, totals hours, sorts descending.
 * @param {Array} workLogs - work log records with { user: { name }, duration, unit }
 * @returns {Array<{ name: string, hours: number }>} sorted descending by hours
 */
export function computeWorkSummary(workLogs) {
  const map = {}
  workLogs.forEach(w => {
    const name = w.user?.name || 'Unknown'
    const hours = w.unit === 'days' ? (parseFloat(w.duration) || 0) * 8 : (parseFloat(w.duration) || 0)
    map[name] = (map[name] || 0) + hours
  })
  return Object.entries(map)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours)
}

/**
 * Builds and downloads a project health PDF.
 * @param {Object} project
 * @param {Array} tasks
 * @param {Array} workLogs
 * @param {Array} comments - last 5 comments, each with { author: { name }, created_at, text }
 * @param {HTMLCanvasElement|null} donutCanvas - task completion donut chart
 */
export function generateProjectPdf(project, tasks, workLogs, comments, donutCanvas) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  let y = 0

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(DARK)
  doc.rect(0, 0, W, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('ARCFLOW', 10, 13)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Project Health Report', 45, 13)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-AU')}`, W - 10, 13, { align: 'right' })

  y = 30

  // ── Project metadata block ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(project.name || 'Untitled Project', 10, y)
  y += 7

  const metaItems = [
    ['Client', project.client?.name || '—'],
    ['Phase', PHASES[project.phase] || project.phase || '—'],
    ['Lead Architect', project.lead?.name || '—'],
    ['Budget', project.budget ? `$${Number(project.budget).toLocaleString('en-US')}` : '—'],
    ['Deadline', project.deadline ? new Date(project.deadline).toLocaleDateString('en-AU') : '—'],
  ]
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  metaItems.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const mx = 10 + col * 95
    const my = y + row * 8
    doc.setTextColor(100, 116, 139)
    doc.text(`${label}:`, mx, my)
    doc.setTextColor(15, 23, 42)
    doc.text(value, mx + 28, my)
  })
  y += Math.ceil(metaItems.length / 2) * 8 + 8

  // ── Donut chart ──────────────────────────────────────────────────────────
  if (donutCanvas) {
    try {
      const imgData = donutCanvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 10, y, 70, 55)
    } catch (_) { /* canvas not ready */ }
  }

  // Stats alongside chart
  const completed = tasks.filter(t => t.status === 'completed').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(13, 148, 136) // teal
  doc.text(`${pct}%`, 95, y + 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Complete', 95, y + 27)
  doc.text(`${completed} of ${total} tasks done`, 95, y + 34)
  y += 65

  // ── Task table ───────────────────────────────────────────────────────────
  const taskRows = tasks.map(t => {
    const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null
    const alert = daysLeft === null ? '—' : daysLeft < 0 ? 'Overdue' : daysLeft <= 2 ? 'Due soon' : '—'
    return [
      t.title || '—',
      t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '—',
      t.status || '—',
      t.assignee?.name || '—',
      t.deadline ? new Date(t.deadline).toLocaleDateString('en-AU') : '—',
      alert,
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Task', 'Priority', 'Status', 'Assignee', 'Deadline', 'Alert']],
    body: taskRows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_ROW },
    columnStyles: {
      0: { cellWidth: 55 },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
  })
  y = doc.lastAutoTable?.finalY + 8 || y + 60

  // ── Work log summary ─────────────────────────────────────────────────────
  const workSummary = computeWorkSummary(workLogs)
  const totalHours = workSummary.reduce((s, w) => s + w.hours, 0)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(`Work Log Summary — Total: ${totalHours}h`, 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Team Member', 'Hours Logged']],
    body: workSummary.map(w => [w.name, `${w.hours}h`]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_ROW },
    columnStyles: { 1: { halign: 'right' } },
  })
  y = doc.lastAutoTable?.finalY + 8 || y + 40

  // ── Recent comments ───────────────────────────────────────────────────────
  const recentComments = comments.slice(0, 5)
  if (recentComments.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Recent Comments', 10, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Author', 'Date', 'Comment']],
      body: recentComments.map(c => [
        c.author?.name || '—',
        c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : '—',
        (c.text || '').slice(0, 120),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_ROW },
      columnStyles: { 2: { cellWidth: 110 } },
    })
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Confidential — ArcFlow CRM', W / 2, pageH - 8, { align: 'center' })

  doc.save(`arcflow-${(project.name || 'project').toLowerCase().replace(/\s+/g, '-')}-health-${new Date().toISOString().slice(0,10)}.pdf`)
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/utils/generateProjectPdf.test.js
```

Expected: All 6 tests pass.

- [ ] **Step 5: Run all tests to confirm nothing broken**

```bash
npx vitest run
```

Expected: All tests pass (includes permissions, emailAuth, deadlineStatus, generatePortfolioPdf, generateProjectPdf).

- [ ] **Step 6: Commit**

```bash
git add src/utils/generateProjectPdf.js src/utils/generateProjectPdf.test.js
git commit -m "feat: add generateProjectPdf utility with computeWorkSummary"
```

---

## Task 4: Reports.jsx — Portfolio Overview tab

**Files:**
- Modify: `src/pages/Reports.jsx`

Replace the stub with the full page including Portfolio Overview. Project Health tab is added in Task 5.

- [ ] **Step 1: Write Reports.jsx with Portfolio Overview tab**

Replace the entire contents of `src/pages/Reports.jsx`:

```jsx
// src/pages/Reports.jsx
import { useEffect, useRef, useState } from 'react'
import { Chart } from 'chart.js/auto'
import { supabase } from '../lib/supabase'
import { useProjects } from '../hooks/useProjects'
import DeadlineBadge from '../components/ui/DeadlineBadge'
import { computePortfolioStats, generatePortfolioPdf } from '../utils/generatePortfolioPdf'
import { computeWorkSummary, generateProjectPdf } from '../utils/generateProjectPdf'

const PHASES = ['SD', 'DD', 'CD', 'CA']
const PHASE_LABELS = { SD: 'Schematic Design', DD: 'Design Development', CD: 'Construction Documents', CA: 'Construction Admin' }
const fmt = n => `$${Number(n || 0).toLocaleString('en-US')}`

// ─── Portfolio Overview ────────────────────────────────────────────────────

function PortfolioTab({ projects }) {
  const [allTasks, setAllTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const donutRef = useRef(null)
  const barRef = useRef(null)
  const donutChart = useRef(null)
  const barChart = useRef(null)

  // Fetch all tasks for all projects
  useEffect(() => {
    async function fetchAllTasks() {
      setLoadingTasks(true)
      const { data } = await supabase
        .from('tasks')
        .select('id, project_id, status, deadline')
      setAllTasks(data || [])
      setLoadingTasks(false)
    }
    fetchAllTasks()
  }, [])

  // Build / rebuild charts when data is ready
  useEffect(() => {
    if (loadingTasks || !donutRef.current || !barRef.current) return
    const stats = computePortfolioStats(projects, allTasks)

    // Destroy previous instances
    donutChart.current?.destroy()
    barChart.current?.destroy()

    // Donut — task status breakdown
    donutChart.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Todo', 'In Progress', 'In Review', 'Completed'],
        datasets: [{
          data: [
            stats.taskBreakdown.todo,
            stats.taskBreakdown.inprogress,
            stats.taskBreakdown.inreview,
            stats.taskBreakdown.completed,
          ],
          backgroundColor: ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
      },
    })

    // Bar — projects per phase
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: PHASES,
        datasets: [{
          label: 'Projects',
          data: PHASES.map(ph => stats.phaseCounts[ph]),
          backgroundColor: '#0d9488',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        },
      },
    })

    return () => {
      donutChart.current?.destroy()
      barChart.current?.destroy()
    }
  }, [allTasks, projects, loadingTasks])

  if (loadingTasks) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading portfolio data…</div>

  const stats = computePortfolioStats(projects, allTasks)

  function handleExport() {
    generatePortfolioPdf(projects, allTasks, {
      donutCanvas: donutRef.current,
      barCanvas: barRef.current,
    })
  }

  return (
    <div>
      {/* Export button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="action-btn primary" onClick={handleExport}>
          <i className="fa-solid fa-file-pdf" style={{ marginRight: 6 }}></i>Export PDF
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          ['Total Portfolio Value', fmt(stats.totalValue), 'fa-sack-dollar'],
          ['Active Projects', stats.activeCount, 'fa-cubes'],
          ['Overall Completion', `${stats.completionPct}%`, 'fa-circle-check'],
          ['Overdue Items', stats.overdueCount, 'fa-triangle-exclamation'],
        ].map(([label, value, icon]) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              <i className={`fa-solid ${icon}`} style={{ marginRight: 6, color: '#0d9488' }}></i>{label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Task Status Breakdown</div>
          <canvas ref={donutRef} width={260} height={220}></canvas>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Projects by Phase</div>
          <canvas ref={barRef} width={300} height={220}></canvas>
        </div>
      </div>

      {/* Project table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0d9488' }}>
              {['Project', 'Client', 'Phase', 'Budget', 'Progress', 'Deadline', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => {
              const pTasks = allTasks.filter(t => t.project_id === p.id)
              const done = pTasks.filter(t => t.status === 'completed').length
              const pct = pTasks.length > 0 ? `${Math.round((done / pTasks.length) * 100)}%` : '—'
              return (
                <tr key={p.id} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.client?.name || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`phase-badge phase-${(p.phase || '').toLowerCase()}`}>{p.phase}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{fmt(p.budget)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{pct}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.deadline ? new Date(p.deadline).toLocaleDateString('en-AU') : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <DeadlineBadge deadline={p.deadline} />
                  </td>
                </tr>
              )
            })}
            {projects.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Project Health Tab (stub — implemented in Task 5) ─────────────────────

function ProjectHealthTab({ projects }) {
  return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Select a project to view its health report. (Coming in Task 5)</div>
}

// ─── Page Shell ───────────────────────────────────────────────────────────

export default function Reports() {
  const { projects, loading } = useProjects()
  const [activeTab, setActiveTab] = useState('portfolio')

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading…</div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 className="brand-title" style={{ marginBottom: 4 }}>Reports</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Portfolio and project health reports — export to PDF</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-default)', marginBottom: 24 }}>
        {[['portfolio', 'Portfolio Overview'], ['health', 'Project Health']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === key ? '2px solid #0d9488' : '2px solid transparent',
              marginBottom: -2,
              color: activeTab === key ? '#0d9488' : 'var(--text-muted)',
              fontWeight: activeTab === key ? 700 : 400,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'portfolio'
        ? <PortfolioTab projects={projects} />
        : <ProjectHealthTab projects={projects} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`. Log in as principal → navigate to `/reports`.

Verify:
- Two tabs "Portfolio Overview" and "Project Health" render.
- Portfolio tab shows 4 stat cards with real data (or zeros if no projects).
- Donut chart and bar chart render.
- Project table lists projects with phase badges and deadline badges.
- "Export PDF" button is present (clicking it downloads a PDF).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Reports.jsx
git commit -m "feat: Reports page - Portfolio Overview tab with charts and stat cards"
```

---

## Task 5: Reports.jsx — Project Health tab

**Files:**
- Modify: `src/pages/Reports.jsx`

Replace the `ProjectHealthTab` stub with the full implementation.

- [ ] **Step 1: Implement ProjectHealthTab**

In `src/pages/Reports.jsx`, replace the `ProjectHealthTab` function (the stub) with:

```jsx
function ProjectHealthTab({ projects }) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState([])
  const [workLogs, setWorkLogs] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const donutRef = useRef(null)
  const donutChart = useRef(null)

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null

  // Fetch project-specific data when a project is selected
  useEffect(() => {
    if (!selectedProjectId) return
    setLoading(true)
    Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, priority, deadline, assignee:assignee_id(id,name)')
        .eq('project_id', selectedProjectId)
        .order('created_at'),
      supabase
        .from('work_logs')
        .select('id, duration, unit, user:user_id(id,name)')
        .eq('project_id', selectedProjectId),
      supabase
        .from('comments')
        .select('id, text, created_at, author:author_id(id,name)')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([tasksRes, logsRes, commentsRes]) => {
      setTasks(tasksRes.data || [])
      setWorkLogs(logsRes.data || [])
      setComments(commentsRes.data || [])
      setLoading(false)
    })
  }, [selectedProjectId])

  // Build / rebuild donut chart
  useEffect(() => {
    if (!donutRef.current || !selectedProjectId) return
    donutChart.current?.destroy()
    const completed = tasks.filter(t => t.status === 'completed').length
    const remaining = tasks.length - completed
    donutChart.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [completed, remaining],
          backgroundColor: ['#10b981', '#334155'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
        },
      },
    })
    return () => { donutChart.current?.destroy() }
  }, [tasks, selectedProjectId])

  function handleExport() {
    if (!selectedProject) return
    generateProjectPdf(
      selectedProject,
      tasks,
      workLogs,
      comments,
      donutRef.current,
    )
  }

  const workSummary = computeWorkSummary(workLogs)
  const totalHours = workSummary.reduce((s, w) => s + w.hours, 0)

  return (
    <div>
      {/* Project selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <select
          className="modal-select"
          style={{ minWidth: 260 }}
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
        >
          <option value="">— Select a project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedProject && (
          <button className="action-btn primary" onClick={handleExport}>
            <i className="fa-solid fa-file-pdf" style={{ marginRight: 6 }}></i>Export PDF
          </button>
        )}
      </div>

      {!selectedProject && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a project above to view its health report.</div>
      )}

      {selectedProject && loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading project data…</div>
      )}

      {selectedProject && !loading && (
        <>
          {/* Project header block */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{selectedProject.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {selectedProject.client?.name && <span style={{ marginRight: 16 }}><i className="fa-solid fa-user" style={{ marginRight: 5 }}></i>{selectedProject.client.name}</span>}
                  {selectedProject.lead?.name && <span><i className="fa-solid fa-hard-hat" style={{ marginRight: 5 }}></i>{selectedProject.lead.name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`phase-badge phase-${(selectedProject.phase || '').toLowerCase()}`}>{selectedProject.phase}</span>
                <DeadlineBadge deadline={selectedProject.deadline} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)' }}>
              <span><strong style={{ color: 'var(--text-secondary)' }}>Budget:</strong> {fmt(selectedProject.budget)}</span>
              <span><strong style={{ color: 'var(--text-secondary)' }}>Deadline:</strong> {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('en-AU') : '—'}</span>
            </div>
          </div>

          {/* Donut chart */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Task Completion</div>
              <canvas ref={donutRef} width={240} height={200}></canvas>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#0d9488' }}>
                  {tasks.length > 0 ? `${Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%` : '—'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed
                </div>
              </div>
            </div>
          </div>

          {/* Task table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Tasks</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0d9488' }}>
                  {['Task', 'Priority', 'Status', 'Assignee', 'Deadline', 'Alert'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{t.title}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`priority-badge priority-${t.priority}`}>{t.priority || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{t.status}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{t.assignee?.name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {t.deadline ? new Date(t.deadline).toLocaleDateString('en-AU') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {t.status !== 'completed' && <DeadlineBadge deadline={t.deadline} />}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>No tasks for this project.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Work log summary */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Work Log Summary — Total: {totalHours}h
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0d9488' }}>
                  <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left', fontSize: 11 }}>Team Member</th>
                  <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'right', fontSize: 11 }}>Hours Logged</th>
                </tr>
              </thead>
              <tbody>
                {workSummary.map((w, i) => (
                  <tr key={w.name} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{w.name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{w.hours}h</td>
                  </tr>
                ))}
                {workSummary.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>No work logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent comments */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Comments</div>
            {comments.length === 0 ? (
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No comments yet.</div>
            ) : (
              comments.map((c, i) => (
                <div key={c.id} style={{ padding: '12px 16px', borderBottom: i < comments.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{c.author?.name || '—'}</strong>
                    &nbsp;·&nbsp;
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : ''}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{(c.text || '').slice(0, 120)}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

Also, since `ProjectHealthTab` uses `useRef`, make sure the `useRef` import at the top of the file already includes it (it does — it was added in Task 4's full file).

- [ ] **Step 2: Verify in browser**

Run `npm run dev`. Log in as principal → Reports → "Project Health" tab.

Verify:
- Dropdown lists all projects.
- Selecting a project shows: header block (name, client, lead, phase badge, deadline badge), donut chart, task table with DeadlineBadge for non-completed tasks, work log summary, recent comments (last 5).
- "Export PDF" button appears after selecting a project. Clicking it downloads a PDF with all sections.

- [ ] **Step 3: Run all tests one final time**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Reports.jsx
git commit -m "feat: Reports page - Project Health tab with charts, task table, work log, comments, PDF export"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ `/reports` route — Task 1
- ✅ Sidebar link visible only to principal — Task 1
- ✅ Two tabs: Portfolio Overview, Project Health — Task 4
- ✅ Portfolio: 4 stat cards (total value, active projects, completion %, overdue items) — Task 4
- ✅ Portfolio: donut chart (task status breakdown) + bar chart (projects by phase) — Task 4
- ✅ Portfolio: project table (name, client, phase, budget, progress, deadline, status badge) — Task 4
- ✅ Portfolio PDF: header, stats, donut, bar, project table, footer — Task 2 + Task 4
- ✅ Project Health: project dropdown — Task 5
- ✅ Project Health: project header block — Task 5
- ✅ Project Health: donut chart (completed vs remaining) — Task 5
- ✅ Project Health: task table with priority, status, assignee, deadline, alert — Task 5
- ✅ Project Health: work log summary (total hours + per-member breakdown) — Task 5
- ✅ Project Health: recent comments (last 5, 120 char truncation) — Task 5
- ✅ Project Health PDF: all 7 sections — Task 3 + Task 5
- ✅ PDF styling: A4, Helvetica, teal #0d9488 header, dark #0f172a header bg, alternating rows — Tasks 2 & 3
- ✅ jsPDF + jspdf-autotable + Chart.js installed — Task 1
- ✅ `generatePortfolioPdf.js` and `generateProjectPdf.js` created — Tasks 2 & 3
- ✅ Tasks separately fetched (not from useProjects join) — Task 4 & 5
- ✅ Chart destroy + recreate on data change — Tasks 4 & 5
- ✅ `getTotalHours` logic (days × 8 + hours) preserved in `computeWorkSummary` — Task 3

**No placeholders:** All steps contain actual code or commands.

**Type consistency:**
- `computePortfolioStats` returns `{ totalValue, activeCount, completionPct, overdueCount, taskBreakdown, phaseCounts }` — used the same way in both the test file (Task 2) and Reports.jsx (Task 4). ✅
- `computeWorkSummary` returns `Array<{ name, hours }>` — used consistently in test (Task 3), Reports.jsx (Task 5), and generateProjectPdf (Task 3). ✅
- `generatePortfolioPdf(projects, allTasks, { donutCanvas, barCanvas })` — called identically in Task 4. ✅
- `generateProjectPdf(project, tasks, workLogs, comments, donutCanvas)` — called identically in Task 5. ✅

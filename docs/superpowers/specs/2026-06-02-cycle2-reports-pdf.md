# Cycle 2: Reports Page + PDF Export — Design Spec
**Date:** 2026-06-02
**Status:** Approved

---

## 1. Goal

Add a Reports page accessible only to the Principal Architect. Two report types:
- **Portfolio Overview** — all projects, financial + status summary with charts
- **Project Health** — single project deep-dive with tasks, work logs, and comments

Both reports are previewed on-screen and exportable as a styled PDF with ARCFLOW branding, stat tables, and embedded charts.

---

## 2. Access Control

- Route `/reports` is only rendered for `profile.role === 'principal'`
- Sidebar link to Reports is only shown for principal
- No RLS changes needed — principal already has SELECT on all tables

---

## 3. Tech Stack Additions

| Library | Purpose | Install |
|---------|---------|---------|
| `jspdf` | PDF generation (client-side, no server) | `npm install jspdf` |
| `jspdf-autotable` | Table rendering in jsPDF | `npm install jspdf-autotable` |
| `chart.js` | Canvas charts (donut, bar) | `npm install chart.js` |

All three are free, MIT-licensed, and work in Vite with no config changes.

---

## 4. File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/pages/Reports.jsx` | Page layout, report type selector, on-screen preview, export button |
| Create | `src/utils/generatePortfolioPdf.js` | Builds and downloads portfolio PDF using jsPDF |
| Create | `src/utils/generateProjectPdf.js` | Builds and downloads project health PDF using jsPDF |
| Modify | `src/components/layout/Sidebar.jsx` | Add Reports nav link (principal only) |
| Modify | `src/App.jsx` | Add `/reports` route |

---

## 5. Reports Page (`src/pages/Reports.jsx`)

### Layout
- Two tabs at top: **Portfolio Overview** | **Project Health**
- **Portfolio Overview tab:** Shows portfolio stats, two Chart.js charts (donut + bar), project table. "Export PDF" button top-right.
- **Project Health tab:** Dropdown to select a project. On selection shows project header, task donut chart, task table, work log summary, recent comments. "Export PDF" button top-right.

### Data sources
- Projects: from `useProjects()` hook (already fetches tasks via join — NOTE: tasks are NOT included in current useProjects query; need to fetch separately or extend)
- Work logs: fetched via direct Supabase query (not per-project hook) for the selected project
- Comments: fetched via direct Supabase query for the selected project
- All data fetched on page mount (portfolio) or on project selection (project health)

### Charts
- Rendered using `Chart.js` in `<canvas>` elements with `useRef`
- Donut chart: task status breakdown — todo (grey), inprogress (blue), inreview (amber), completed (green)
- Bar chart (portfolio only): count of projects per phase — SD, DD, CD, CA
- Charts are destroyed and re-created on data change using `chartInstance.destroy()`

---

## 6. Portfolio Overview Report

### On-screen sections

**Stat row (4 cards):**
- Total Portfolio Value (`$X`)
- Active Projects (count)
- Overall Completion % (completed tasks / all tasks)
- Overdue Items (projects + tasks past deadline)

**Charts row:**
- Left: Donut — task status breakdown across all projects
- Right: Bar — project count per phase

**Project table:**
| Column | Source |
|--------|--------|
| Project Name | `project.name` |
| Client | `project.client.name` |
| Phase | `project.phase` |
| Budget | `project.budget` formatted as currency |
| Progress | `completedTasks/totalTasks %` |
| Deadline | formatted date |
| Status | DeadlineBadge (overdue/soon/ok) |

### PDF content
1. Header: ARCFLOW logo text + "Portfolio Report" + date generated
2. Summary stats block (4 values in a 2×2 grid)
3. Donut chart image (captured from canvas via `canvas.toDataURL()`)
4. Bar chart image
5. Project table via `jspdf-autotable`
6. Footer: "Confidential — ArcFlow CRM"

---

## 7. Project Health Report

### On-screen sections

**Project header block:**
- Project name (large), client name, lead architect, phase badge, budget, deadline + DeadlineBadge

**Donut chart:** completed vs. remaining tasks (2 segments only)

**Task table:**
| Column | Source |
|--------|--------|
| Task Title | `task.title` |
| Priority | `task.priority` (Low/Medium/High) |
| Status | `task.status` |
| Assignee | `task.assignee.name` |
| Deadline | formatted date |
| Alert | Overdue / Due soon / — |

**Work log summary:**
- Total hours logged (using existing `getTotalHours` logic: days × 8 + hours)
- Table: Team member name → hours logged (sorted descending)

**Recent comments (last 5):**
- Author name · date · comment text (truncated to 120 chars)

### PDF content
1. Header: ARCFLOW + "Project Health Report" + project name + date
2. Project metadata block (name, client, phase, lead, budget, deadline)
3. Task completion donut chart image
4. Task table via `jspdf-autotable`
5. Work log summary table
6. Recent comments table
7. Footer: "Confidential — ArcFlow CRM"

---

## 8. PDF Styling

- Page size: A4
- Font: Helvetica (built into jsPDF)
- Primary colour: `#0d9488` (teal, matches app accent)
- Header background: dark `#0f172a`
- Header text: white
- Table header background: `#0d9488`, white text
- Alternating row colours: white / `#f8fafc`
- All monetary values formatted as `$X,XXX`

---

## 9. Sidebar + Routing

**Sidebar:** Add Reports link between Team and Sign Out, visible only when `profile?.role === 'principal'`:
```jsx
{profile?.role === 'principal' && (
  <NavLink to="/reports">
    <i className="fa-solid fa-file-chart-column"></i>
    <span>Reports</span>
  </NavLink>
)}
```

**App.jsx:** Add `<Route path="/reports" element={<Reports />} />` inside the authenticated shell routes.

---

## 10. Out of Scope (Cycle 2)

- Scheduling or emailing reports
- Saving reports to Supabase storage
- Custom date range filtering
- Client-visible reports (Cycle 3 client portal handles this)
- Architect-accessible reports

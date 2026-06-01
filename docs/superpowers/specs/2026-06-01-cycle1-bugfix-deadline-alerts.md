# Cycle 1: Add-Client Bug Fix + Deadline Alerts — Design Spec
**Date:** 2026-06-01
**Status:** Approved

---

## 1. Add-Client Bug Fix

### Problem
`AddClientModal` calls the `create-user` Supabase Edge Function. The call may fail silently if:
- The Vercel build hasn't deployed the updated modal code yet
- The edge function returns a non-2xx response that isn't surfaced clearly in the UI

### Fix
- Ensure `AddClientModal` uses the same edge function call pattern as `AddStaffModal` (already done in last commit — verify deployment)
- Add `console.error` logging and ensure the error state is always shown in the modal UI
- Test the edge function directly via curl to confirm it accepts `role: "client"`
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel environment variables

### No new files — only verification and minor error-handling hardening in `AddClientModal.jsx`

---

## 2. Deadline Alerts

### Goal
Surface overdue and soon-due tasks/projects visually throughout the app so the Principal and architects can act on them immediately. No new DB tables — purely computed from existing `deadline` fields.

### Warning Thresholds
- **Overdue:** deadline < today → red ⚠ badge, label "Overdue"
- **Due soon:** deadline is today or within the next 2 days → amber ⏰ badge, label "Due soon"
- **OK:** deadline > 2 days away → no badge
- **No deadline:** no badge

### Shared Utility

**New file: `src/utils/deadlineStatus.js`**

```js
export function getDeadlineStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(dateStr); due.setHours(0,0,0,0)
  const diffDays = Math.ceil((due - today) / 86400000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 2) return 'soon'
  return 'ok'
}
```

**New file: `src/components/ui/DeadlineBadge.jsx`**
- Props: `deadline` (date string)
- Renders nothing if status is `'ok'` or `null`
- Renders `⚠ Overdue` in red if `'overdue'`
- Renders `⏰ Due soon` in amber if `'soon'`
- Small pill badge style consistent with existing `phase-badge` class

---

### 2a. Dashboard — "Attention Required" Panel

**Modified: `src/pages/Dashboard.jsx`**

New section below the stat cards called **"Attention Required"**. Only shown if there are overdue or soon-due items.

Content:
- Lists tasks where `status !== 'completed'` and deadline is overdue or soon
- Lists projects where deadline is overdue or soon
- Each row shows: item name → project name → deadline → badge
- Principal sees all items studio-wide; architect sees only their assigned tasks/projects
- Clicking a row navigates to the relevant project detail page
- If no items: section is hidden entirely (no empty state clutter)

---

### 2b. Kanban Task Cards

**Modified: `src/components/kanban/TaskCard.jsx`**

- Import `DeadlineBadge` and render it on cards that have a deadline
- Position: below the task title, above the assignee row

---

### 2c. Projects List

**Modified: `src/pages/Projects.jsx`**

- Add a "Deadline" column to the projects table (already has a deadline field in data)
- Render deadline date + `DeadlineBadge` inline

---

### 2d. Project Detail — Task List

**Modified: `src/pages/ProjectDetail.jsx`**

- In the task list/detail views, show `DeadlineBadge` next to each task's deadline date

---

## 3. Out of Scope (Cycle 1)

- Push notifications or email alerts for deadlines
- Configurable warning thresholds per user
- Snoozing / dismissing alerts
- Reports page (Cycle 2)
- Client portal (Cycle 3)
- Gantt / Timesheets (Cycle 4)

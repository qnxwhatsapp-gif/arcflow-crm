# ArcFlow CRM — Full Production Design Spec
**Date:** 2026-05-31  
**Status:** Approved  
**Stack:** React + Vite · Supabase · Vercel

---

## 1. Goal

Convert the existing ArcFlow prototype (vanilla HTML/CSS/JS with localStorage) into a production-ready, multi-user CRM for a small architecture studio (5–15 people). All data must be shared and synced in real time across users. The app must be hostable entirely for free.

---

## 2. Users & Roles

| Role | Description |
|---|---|
| `principal` | Studio admin. Full access to all projects, all data, financials, ACL matrix. |
| `architect` | Staff architect. Access determined by the permissions matrix. |
| `client` | Project client. Sees only their own project(s). Access determined by permissions matrix. |
| `pending` | New Google sign-in not yet assigned a role. Sees a "Pending Access" screen. |

The Principal is seeded once via a setup SQL script. All subsequent new users land as `pending` until the Principal assigns them a role from the Team page.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Free)                         │
│              React + Vite SPA                           │
│   (Dashboard, Kanban, Worklogs, Comments, Team)          │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / Supabase JS Client
┌───────────────────────▼─────────────────────────────────┐
│                  Supabase (Free Tier)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth       │  │  PostgreSQL  │  │  Realtime     │  │
│  │  Google     │  │  + RLS       │  │  Subscriptions│  │
│  │  OAuth      │  │              │  │               │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

- No custom backend server. The React app communicates directly with Supabase via the JS client.
- RLS policies enforce data access at the database level — client users cannot query other clients' data even directly.
- Realtime subscriptions on `tasks`, `comments`, and `work_logs` so all users see live updates.

---

## 4. Database Schema

### `profiles` (extends Supabase `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users.id |
| name | text | |
| email | text | |
| role | text | 'principal' \| 'architect' \| 'client' \| 'pending' |
| avatar_initials | text | e.g. "SL" |
| company | text | clients only |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| description | text | |
| phase | text | 'SD' \| 'DD' \| 'CD' \| 'CA' |
| budget | numeric | |
| deadline | date | |
| client_id | uuid | FK → profiles.id |
| lead_id | uuid | FK → profiles.id |
| created_by | uuid | FK → profiles.id |
| created_at | timestamptz | |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| title | text | |
| description | text | |
| status | text | 'todo' \| 'inprogress' \| 'inreview' \| 'completed' |
| priority | text | 'Low' \| 'Medium' \| 'High' |
| phase | text | 'SD' \| 'DD' \| 'CD' \| 'CA' |
| assignee_id | uuid | FK → profiles.id |
| deadline | date | |

### `subtasks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| task_id | uuid | FK → tasks.id |
| title | text | |
| status | text | 'todo' \| 'completed' |
| assignee_id | uuid | FK → profiles.id |
| deadline | date | |

### `work_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| task_id | uuid | FK → tasks.id |
| user_id | uuid | FK → profiles.id |
| duration | numeric | |
| unit | text | 'hours' \| 'days' |
| date | date | |
| notes | text | |

### `comments`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → projects.id |
| author_id | uuid | FK → profiles.id |
| text | text | |
| created_at | timestamptz | |

### `permissions`
| Column | Type | Notes |
|---|---|---|
| role | text | PK — 'architect' \| 'client' |
| can_create_projects | bool | |
| can_create_tasks | bool | |
| can_log_work | bool | |
| can_change_phase | bool | |
| can_view_financials | bool | |
| can_moderate_comments | bool | |

---

## 5. Row Level Security (RLS)

| Table | principal | architect | client |
|---|---|---|---|
| profiles | full | read own | read own |
| projects | full | read if lead or has task | read if client_id = self |
| tasks | full | CRUD if project accessible | read if project accessible |
| subtasks | full | CRUD if task accessible | read if task accessible |
| work_logs | full | CRUD own rows | no access |
| comments | full | CRUD if project accessible | CRUD if project accessible |
| permissions | full | read own role row | read own role row |

---

## 6. Frontend Structure

```
src/
├── main.jsx
├── App.jsx                    # Router + auth guard
├── lib/
│   ├── supabase.js            # Supabase client (env vars)
│   └── permissions.js         # hasPermission(user, key) helper
├── contexts/
│   ├── AuthContext.jsx         # Session + current user profile
│   └── PermissionsContext.jsx  # Role permissions from DB
├── pages/
│   ├── Login.jsx              # Google OAuth sign-in
│   ├── Pending.jsx            # "Awaiting role assignment" screen
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── ProjectDetail.jsx      # 4 tabs: Overview, Kanban, Worklogs, Comments
│   └── Team.jsx               # Staff + clients + ACL matrix
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── TopNavbar.jsx
│   ├── dashboard/
│   │   ├── StatCard.jsx
│   │   └── ActivityFeed.jsx
│   ├── projects/
│   │   ├── ProjectRow.jsx
│   │   └── PhaseTimeline.jsx
│   ├── kanban/
│   │   ├── KanbanBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   └── TaskCard.jsx
│   ├── worklogs/
│   │   └── WorkLogList.jsx
│   ├── collaboration/
│   │   └── CommentThread.jsx
│   └── modals/
│       ├── CreateProjectModal.jsx
│       ├── AddTaskModal.jsx
│       ├── TaskDetailModal.jsx
│       ├── LogWorkModal.jsx
│       ├── AddClientModal.jsx
│       └── AddStaffModal.jsx
└── hooks/
    ├── useProjects.js          # Queries + realtime
    ├── useTasks.js             # CRUD + realtime
    ├── useComments.js          # Comments + realtime
    └── useWorkLogs.js          # Work log queries
```

---

## 7. Auth Flow

1. User visits app → `AuthContext` checks Supabase session
2. No session → redirect to `Login.jsx`
3. User clicks "Sign in with Google" → Supabase Google OAuth
4. On return: fetch `profiles` row for this user
   - `role = pending` → render `Pending.jsx`
   - `role` assigned → render main app
5. Principal assigns roles from Team page → user refreshes and gains access

**First-time setup:** A seed SQL script inserts the Principal's profile row with `role = 'principal'` using their Google account email.

---

## 8. Realtime

Supabase Realtime subscriptions are set up in:
- `useTasks.js` — task status changes appear live on Kanban for all viewers
- `useComments.js` — new comments appear instantly without refresh
- `useProjects.js` — project phase changes reflect immediately on dashboard

---

## 9. Preserved Visual Design

The existing ArcFlow dark theme (CSS custom properties, blueprint grid background, phase badges, Kanban cards, stat cards) is preserved verbatim in `src/styles.css`. No visual redesign — this is purely a data layer + component architecture upgrade.

---

## 10. Deployment

| Service | Role | Free limit |
|---|---|---|
| GitHub | Source + CI trigger | Free |
| Vercel | Hosts React SPA | Unlimited deploys, 100GB bandwidth/mo |
| Supabase | DB + Auth + Realtime | 500MB DB, 50k MAU, 2 projects |

**Steps:**
1. Push repo to GitHub
2. Connect to Vercel → set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars
3. Run `supabase/migrations/001_init.sql` in Supabase SQL editor
4. Enable Google provider in Supabase Auth dashboard
5. Run seed script to set Principal user role

---

## 11. Out of Scope

- File uploads (team will use external links pasted into project fields)
- Email notifications
- Mobile native app
- Invoice / billing features

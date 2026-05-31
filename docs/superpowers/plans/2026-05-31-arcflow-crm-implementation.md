# ArcFlow CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the ArcFlow vanilla JS prototype into a production React + Supabase CRM with real multi-user auth, shared database, and realtime sync — deployable for free on Vercel + Supabase.

**Architecture:** React + Vite SPA talks directly to Supabase (PostgreSQL + Google OAuth + Realtime) via the Supabase JS client. No custom server. Row Level Security enforces data access per role at the DB layer. Realtime subscriptions keep tasks and comments live across all users.

**Tech Stack:** React 18, Vite, react-router-dom v6, @supabase/supabase-js v2, Vitest, @testing-library/react

---

## File Map

**New files to create:**
```
architecture-project-crm/
├── package.json
├── vite.config.js
├── index.html                          (replaces existing)
├── .env.local                          (gitignored)
├── .env.example
├── vercel.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles.css                      (copy of existing styles.css)
│   ├── lib/
│   │   ├── supabase.js
│   │   └── permissions.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── PermissionsContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Pending.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetail.jsx
│   │   └── Team.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopNavbar.jsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.jsx
│   │   │   └── ActivityFeed.jsx
│   │   ├── projects/
│   │   │   ├── ProjectRow.jsx
│   │   │   └── PhaseTimeline.jsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── KanbanColumn.jsx
│   │   │   └── TaskCard.jsx
│   │   ├── worklogs/
│   │   │   └── WorkLogList.jsx
│   │   ├── collaboration/
│   │   │   └── CommentThread.jsx
│   │   └── modals/
│   │       ├── CreateProjectModal.jsx
│   │       ├── AddTaskModal.jsx
│   │       ├── TaskDetailModal.jsx
│   │       ├── LogWorkModal.jsx
│   │       ├── AddClientModal.jsx
│   │       └── AddStaffModal.jsx
│   └── hooks/
│       ├── useProjects.js
│       ├── useTasks.js
│       ├── useComments.js
│       └── useWorkLogs.js
├── supabase/
│   └── migrations/
│       ├── 001_init.sql
│       └── 002_seed_permissions.sql
└── tests/
    └── lib/
        └── permissions.test.js
```

---

## Task 1: Scaffold Vite + React Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "arcflow-crm",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^14.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^24.0.0",
    "vite": "^5.1.0",
    "vitest": "^1.3.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 3: Create tests/setup.js**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ArcFlow // Architecture Project CRM</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 6: Copy existing styles.css into src/styles.css**

Copy the full contents of the existing `styles.css` file into `src/styles.css`. No changes needed — the existing design is preserved as-is.

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js index.html src/main.jsx src/styles.css tests/setup.js
git commit -m "feat: scaffold vite + react project"
```

---

## Task 2: Supabase Database Migrations

**Files:**
- Create: `supabase/migrations/001_init.sql`
- Create: `supabase/migrations/002_seed_permissions.sql`

- [ ] **Step 1: Create 001_init.sql**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('principal','architect','client','pending')),
  avatar_initials TEXT NOT NULL DEFAULT '?',
  company TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on new auth user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_initials)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  phase TEXT NOT NULL DEFAULT 'SD' CHECK (phase IN ('SD','DD','CD','CA')),
  budget NUMERIC DEFAULT 0,
  deadline DATE,
  client_id UUID REFERENCES profiles(id),
  lead_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','inprogress','inreview','completed')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  phase TEXT NOT NULL DEFAULT 'SD' CHECK (phase IN ('SD','DD','CD','CA')),
  assignee_id UUID REFERENCES profiles(id),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtasks
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','completed')),
  assignee_id UUID REFERENCES profiles(id),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Logs
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  duration NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'hours' CHECK (unit IN ('hours','days')),
  date DATE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions matrix
CREATE TABLE permissions (
  role TEXT PRIMARY KEY CHECK (role IN ('architect','client')),
  can_create_projects BOOLEAN DEFAULT FALSE,
  can_create_tasks BOOLEAN DEFAULT TRUE,
  can_log_work BOOLEAN DEFAULT TRUE,
  can_change_phase BOOLEAN DEFAULT TRUE,
  can_view_financials BOOLEAN DEFAULT FALSE,
  can_moderate_comments BOOLEAN DEFAULT TRUE
);

-- ===================== ROW LEVEL SECURITY =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (
  get_user_role() = 'principal' OR id = auth.uid()
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_principal" ON profiles FOR UPDATE USING (get_user_role() = 'principal');
CREATE POLICY "profiles_insert_trigger" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- PROJECTS
CREATE POLICY "projects_principal" ON projects FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "projects_architect_select" ON projects FOR SELECT USING (
  get_user_role() = 'architect' AND (
    lead_id = auth.uid() OR
    id IN (SELECT project_id FROM tasks WHERE assignee_id = auth.uid())
  )
);
CREATE POLICY "projects_client_select" ON projects FOR SELECT USING (
  get_user_role() = 'client' AND client_id = auth.uid()
);

-- TASKS
CREATE POLICY "tasks_principal" ON tasks FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "tasks_architect" ON tasks FOR ALL USING (
  get_user_role() = 'architect' AND
  project_id IN (
    SELECT id FROM projects WHERE lead_id = auth.uid()
    UNION
    SELECT project_id FROM tasks t2 WHERE t2.assignee_id = auth.uid()
  )
);
CREATE POLICY "tasks_client_select" ON tasks FOR SELECT USING (
  get_user_role() = 'client' AND
  project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
);

-- SUBTASKS
CREATE POLICY "subtasks_principal" ON subtasks FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "subtasks_architect" ON subtasks FOR ALL USING (
  get_user_role() = 'architect' AND
  task_id IN (SELECT id FROM tasks WHERE project_id IN (
    SELECT id FROM projects WHERE lead_id = auth.uid()
    UNION
    SELECT project_id FROM tasks t2 WHERE t2.assignee_id = auth.uid()
  ))
);
CREATE POLICY "subtasks_client_select" ON subtasks FOR SELECT USING (
  get_user_role() = 'client' AND
  task_id IN (SELECT id FROM tasks WHERE project_id IN (
    SELECT id FROM projects WHERE client_id = auth.uid()
  ))
);

-- WORK LOGS
CREATE POLICY "worklogs_principal" ON work_logs FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "worklogs_architect" ON work_logs FOR ALL USING (
  get_user_role() = 'architect' AND user_id = auth.uid()
);

-- COMMENTS
CREATE POLICY "comments_principal" ON comments FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "comments_architect" ON comments FOR ALL USING (
  get_user_role() = 'architect' AND
  project_id IN (
    SELECT id FROM projects WHERE lead_id = auth.uid()
    UNION
    SELECT project_id FROM tasks WHERE assignee_id = auth.uid()
  )
);
CREATE POLICY "comments_client" ON comments FOR ALL USING (
  get_user_role() = 'client' AND
  project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
);

-- PERMISSIONS (read-only for non-principals)
CREATE POLICY "permissions_principal" ON permissions FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "permissions_read" ON permissions FOR SELECT USING (true);
```

- [ ] **Step 2: Create 002_seed_permissions.sql**

```sql
INSERT INTO permissions (role, can_create_projects, can_create_tasks, can_log_work, can_change_phase, can_view_financials, can_moderate_comments)
VALUES
  ('architect', false, true, true, true, false, true),
  ('client',    false, false, false, false, false, true)
ON CONFLICT (role) DO NOTHING;
```

- [ ] **Step 3: Run migrations in Supabase**

1. Open your Supabase project → SQL Editor
2. Paste and run `001_init.sql` — expected: no errors, tables created
3. Paste and run `002_seed_permissions.sql` — expected: 2 rows inserted into `permissions`

- [ ] **Step 4: Seed the Principal user**

After your first Google login (Step done in Task 5), run this SQL replacing the email with yours:

```sql
UPDATE profiles SET role = 'principal' WHERE email = 'your-email@gmail.com';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add supabase migrations and RLS policies"
```

---

## Task 3: Supabase Client + Permissions Utility

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/lib/permissions.js`
- Create: `.env.example`
- Create: `.env.local` (gitignored)
- Create: `.gitignore`
- Test: `tests/lib/permissions.test.js`

- [ ] **Step 1: Create .gitignore**

```
node_modules/
dist/
.env.local
.env
```

- [ ] **Step 2: Create .env.example**

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Create .env.local**

Fill in your actual values from Supabase project → Settings → API:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 4: Create src/lib/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 5: Write failing test for permissions.js**

Create `tests/lib/permissions.test.js`:

```js
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
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `permissions.js` does not exist yet.

- [ ] **Step 7: Create src/lib/permissions.js**

```js
export function hasPermission(user, permissions, key) {
  if (!user) return false
  if (user.role === 'principal') return true
  if (!permissions || !permissions[user.role]) return false
  return !!permissions[user.role][key]
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test
```

Expected: 6 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ tests/ .gitignore .env.example
git commit -m "feat: add supabase client and permissions utility"
```

---

## Task 4: AuthContext + App Routing

**Files:**
- Create: `src/contexts/AuthContext.jsx`
- Create: `src/App.jsx`

- [ ] **Step 1: Create src/contexts/AuthContext.jsx**

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

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, signInWithGoogle, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Create src/App.jsx**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PermissionsProvider } from './contexts/PermissionsContext'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Team from './pages/Team'
import Sidebar from './components/layout/Sidebar'
import TopNavbar from './components/layout/TopNavbar'

function AppShell() {
  const { session, profile } = useAuth()

  if (session === undefined) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (!session) return <Login />

  if (!profile || profile.role === 'pending') return <Pending />

  return (
    <PermissionsProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-workspace">
          <TopNavbar />
          <section className="workspace-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/team" element={<Team />} />
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

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.jsx src/App.jsx
git commit -m "feat: add auth context and app routing"
```

---

## Task 5: Login + Pending Pages

**Files:**
- Create: `src/pages/Login.jsx`
- Create: `src/pages/Pending.jsx`

- [ ] **Step 1: Create src/pages/Login.jsx**

```jsx
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="brand-logo-icon"><span>A</span></div>
          <h1 className="brand-title">ARCFLOW</h1>
          <p className="brand-subtitle">ARCHITECTURE PORTFOLIO &amp; PROJECT CRM</p>
        </div>

        <button className="login-btn" onClick={signInWithGoogle} style={{ marginTop: 24 }}>
          <i className="fa-brands fa-google" style={{ marginRight: 10 }}></i>
          Sign in with Google
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
          Access is granted by your Principal Architect after first sign-in.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/Pending.jsx**

```jsx
import { useAuth } from '../contexts/AuthContext'

export default function Pending() {
  const { profile, signOut } = useAuth()

  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="brand-logo-icon" style={{ margin: '0 auto 20px' }}><span>A</span></div>
        <h2 className="brand-title" style={{ fontSize: 22, marginBottom: 12 }}>Access Pending</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
          You're signed in as <strong>{profile?.email}</strong>.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
          Your account is awaiting role assignment from the Principal Architect. Please contact them to gain access.
        </p>
        <button className="action-btn" onClick={signOut}>
          <i className="fa-solid fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.jsx src/pages/Pending.jsx
git commit -m "feat: add login and pending access pages"
```

---

## Task 6: Layout — Sidebar + TopNavbar

**Files:**
- Create: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/TopNavbar.jsx`

- [ ] **Step 1: Create src/components/layout/Sidebar.jsx**

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><span>A</span></div>
        <div className="sidebar-logo-text">ARCFLOW</div>
      </div>

      <div className="user-profile-badge">
        <div className="profile-avatar">{profile?.avatar_initials || '?'}</div>
        <div className="profile-info">
          <div className="profile-name">{profile?.name}</div>
          <div className={`profile-role role-${profile?.role}`}>{profile?.role}</div>
        </div>
      </div>

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
      </ul>

      <div className="logout-btn-container">
        <button className="nav-link" onClick={handleSignOut} style={{ background: 'none', border: 'none', width: '100%', color: 'var(--priority-high)', cursor: 'pointer' }}>
          <i className="fa-solid fa-sign-out-alt"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create src/components/layout/TopNavbar.jsx**

```jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../contexts/PermissionsContext'

const TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/projects': 'Projects Portfolio',
  '/team': 'Studio & Client Directory',
}

export default function TopNavbar({ onAction }) {
  const location = useLocation()
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()

  const title = TITLES[location.pathname] || 'Project Workspace'

  return (
    <header className="top-navbar">
      <h2 className="navbar-title">{title}</h2>
      <div className="navbar-actions">
        {location.pathname === '/projects' && hasPermission('canCreateProjects') && (
          <button className="action-btn primary" onClick={() => onAction?.('createProject')}>
            <i className="fa-solid fa-plus"></i> New Project
          </button>
        )}
        {location.pathname === '/dashboard' && hasPermission('canCreateProjects') && (
          <button className="action-btn primary" onClick={() => navigate('/projects')}>
            <i className="fa-solid fa-plus"></i> New Project
          </button>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add sidebar and top navbar layout components"
```

---

## Task 7: PermissionsContext

**Files:**
- Create: `src/contexts/PermissionsContext.jsx`

- [ ] **Step 1: Create src/contexts/PermissionsContext.jsx**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { hasPermission as checkPermission } from '../lib/permissions'

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { profile } = useAuth()
  const [permissions, setPermissions] = useState({})

  useEffect(() => {
    supabase.from('permissions').select('*').then(({ data }) => {
      if (!data) return
      const map = {}
      data.forEach(row => { map[row.role] = row })
      setPermissions(map)
    })
  }, [])

  async function updatePermission(role, key, value) {
    await supabase.from('permissions').update({ [key]: value }).eq('role', role)
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [key]: value }
    }))
  }

  function hasPermission(key) {
    return checkPermission(profile, permissions, key)
  }

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, updatePermission }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  return useContext(PermissionsContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/PermissionsContext.jsx
git commit -m "feat: add permissions context with live DB sync"
```

---

## Task 8: Data Hooks

**Files:**
- Create: `src/hooks/useProjects.js`
- Create: `src/hooks/useTasks.js`
- Create: `src/hooks/useComments.js`
- Create: `src/hooks/useWorkLogs.js`

- [ ] **Step 1: Create src/hooks/useProjects.js**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select(`*, client:client_id(id,name,company,avatar_initials), lead:lead_id(id,name,avatar_initials)`)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()

    const channel = supabase.channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function createProject({ name, description, phase = 'SD', budget, deadline, clientId, leadId, createdBy }) {
    const { data, error } = await supabase.from('projects').insert({
      name, description, phase, budget, deadline,
      client_id: clientId, lead_id: leadId, created_by: createdBy
    }).select().single()
    if (!error) setProjects(prev => [data, ...prev])
    return { data, error }
  }

  async function updateProject(id, updates) {
    const { error } = await supabase.from('projects').update(updates).eq('id', id)
    if (!error) setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    return { error }
  }

  return { projects, loading, createProject, updateProject, refetch: fetchProjects }
}
```

- [ ] **Step 2: Create src/hooks/useTasks.js**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchTasks() {
    if (!projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('tasks')
      .select(`*, assignee:assignee_id(id,name,avatar_initials), subtasks(*)`)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()

    const channel = supabase.channel(`tasks-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId])

  async function createTask({ projectId, title, description, phase, assigneeId, priority, deadline }) {
    const { data, error } = await supabase.from('tasks').insert({
      project_id: projectId, title, description, phase,
      assignee_id: assigneeId, priority, deadline
    }).select(`*, assignee:assignee_id(id,name,avatar_initials), subtasks(*)`).single()
    if (!error) setTasks(prev => [...prev, data])
    return { data, error }
  }

  async function updateTaskStatus(taskId, status) {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    return { error }
  }

  async function createSubtask({ taskId, title, assigneeId, deadline }) {
    const { error } = await supabase.from('subtasks').insert({
      task_id: taskId, title, assignee_id: assigneeId, deadline
    })
    if (!error) fetchTasks()
    return { error }
  }

  async function updateSubtaskStatus(subtaskId, status) {
    const { error } = await supabase.from('subtasks').update({ status }).eq('id', subtaskId)
    if (!error) fetchTasks()
    return { error }
  }

  return { tasks, loading, createTask, updateTaskStatus, createSubtask, updateSubtaskStatus, refetch: fetchTasks }
}
```

- [ ] **Step 3: Create src/hooks/useComments.js**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useComments(projectId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchComments() {
    if (!projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('comments')
      .select(`*, author:author_id(id,name,avatar_initials,role)`)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()

    const channel = supabase.channel(`comments-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` }, fetchComments)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId])

  async function addComment({ projectId, authorId, text }) {
    const { error } = await supabase.from('comments').insert({ project_id: projectId, author_id: authorId, text })
    return { error }
  }

  return { comments, loading, addComment }
}
```

- [ ] **Step 4: Create src/hooks/useWorkLogs.js**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useWorkLogs(projectId) {
  const [workLogs, setWorkLogs] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchWorkLogs() {
    if (!projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('work_logs')
      .select(`*, user:user_id(id,name,avatar_initials), task:task_id(id,title)`)
      .eq('project_id', projectId)
      .order('date', { ascending: false })
    setWorkLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchWorkLogs() }, [projectId])

  async function logWork({ projectId, taskId, userId, duration, unit, date, notes }) {
    const { error } = await supabase.from('work_logs').insert({
      project_id: projectId, task_id: taskId, user_id: userId,
      duration, unit, date, notes
    })
    if (!error) fetchWorkLogs()
    return { error }
  }

  function getTotalHours() {
    return workLogs.reduce((sum, w) => {
      return sum + (w.unit === 'days' ? parseFloat(w.duration) * 8 : parseFloat(w.duration))
    }, 0)
  }

  return { workLogs, loading, logWork, getTotalHours }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add data hooks for projects, tasks, comments, work logs"
```

---

## Task 9: Dashboard Page + Stat Components

**Files:**
- Create: `src/components/dashboard/StatCard.jsx`
- Create: `src/components/dashboard/ActivityFeed.jsx`
- Create: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Create src/components/dashboard/StatCard.jsx**

```jsx
export default function StatCard({ title, value, desc, color = 'teal', valueStyle = {} }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-title">{title}</div>
      <div className="stat-value" style={valueStyle}>{value}</div>
      <div className="stat-desc">{desc}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/dashboard/ActivityFeed.jsx**

```jsx
import { useNavigate } from 'react-router-dom'

export default function ActivityFeed({ comments }) {
  const navigate = useNavigate()

  if (!comments.length) {
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No updates logged yet.</div>
  }

  return (
    <div className="activity-feed">
      {comments.slice(0, 5).map(c => {
        const role = c.author?.role || 'architect'
        const iconColor = role === 'client' ? 'green' : role === 'principal' ? 'gold' : 'teal'
        const dateStr = new Date(c.created_at).toLocaleDateString() + ' ' + new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        return (
          <div key={c.id} className="activity-item">
            <div className={`activity-icon ${iconColor}`}>
              <i className="fa-solid fa-comment-dots"></i>
            </div>
            <div className="activity-details">
              <div>
                <strong>{c.author?.name}</strong> in{' '}
                <span
                  style={{ color: 'var(--accent-teal)', cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${c.project_id}`)}
                >
                  {c.projectName}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>"{c.text}"</div>
              <div className="activity-time">{dateStr}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/Dashboard.jsx**

```jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionsContext'
import { useProjects } from '../hooks/useProjects'
import StatCard from '../components/dashboard/StatCard'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PHASES = { SD: 'Schematic Design', DD: 'Design Development', CD: 'Construction Docs', CA: 'Construction Admin' }

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
                      <div className="progress-container"><div className="progress-bar" style={{ width: `${0}%` }}></div></div>
                      <span className="progress-text">–</span>
                    </td>
                    <td>{p.deadline ? new Date(p.deadline).toLocaleDateString() : '–'}</td>
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

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ src/pages/Dashboard.jsx
git commit -m "feat: add dashboard page with stat cards and activity feed"
```

---

## Task 10: Projects List Page + ProjectRow

**Files:**
- Create: `src/components/projects/ProjectRow.jsx`
- Create: `src/pages/Projects.jsx`
- Create: `src/components/modals/CreateProjectModal.jsx`

- [ ] **Step 1: Create src/components/projects/ProjectRow.jsx**

```jsx
import { useNavigate } from 'react-router-dom'

export default function ProjectRow({ project }) {
  const navigate = useNavigate()
  const client = project.client
  const lead = project.lead
  const clientStr = client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : 'Private Client'

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
      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>–</span></td>
      <td>
        <div className="progress-container"><div className="progress-bar" style={{ width: '0%' }}></div></div>
        <span className="progress-text">–</span>
      </td>
      <td>{project.deadline ? new Date(project.deadline).toLocaleDateString() : '–'}</td>
    </tr>
  )
}
```

- [ ] **Step 2: Create src/components/modals/CreateProjectModal.jsx**

```jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [architects, setArchitects] = useState([])
  const [form, setForm] = useState({ name: '', clientId: '', leadId: '', budget: '', deadline: '', description: '' })

  useEffect(() => {
    if (!open) return
    supabase.from('profiles').select('id,name,role,company').then(({ data }) => {
      setClients((data || []).filter(u => u.role === 'client'))
      setArchitects((data || []).filter(u => u.role !== 'client' && u.role !== 'pending'))
    })
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await onCreated({
      name: form.name, description: form.description,
      budget: parseFloat(form.budget) || 0, deadline: form.deadline,
      clientId: form.clientId, leadId: form.leadId, createdBy: profile.id
    })
    if (!error) { setForm({ name: '', clientId: '', leadId: '', budget: '', deadline: '', description: '' }); onClose() }
  }

  if (!open) return null

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Create New Project</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {[['name','Project Name','text','e.g. Helix Residential Villa'],['budget','Budget ($)','number','e.g. 150000'],['deadline','Deadline','date','']].map(([key,label,type,ph]) => (
              <div className="modal-form-group" key={key}>
                <label className="modal-label">{label}</label>
                <input type={type} className="modal-input" placeholder={ph} required value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} />
              </div>
            ))}
            <div className="modal-form-group">
              <label className="modal-label">Client</label>
              <select className="modal-select" required value={form.clientId} onChange={e => setForm(f => ({...f,clientId:e.target.value}))}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Lead Architect</label>
              <select className="modal-select" required value={form.leadId} onChange={e => setForm(f => ({...f,leadId:e.target.value}))}>
                <option value="">Select lead...</option>
                {architects.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Description</label>
              <textarea className="modal-textarea" placeholder="Brief project description..." value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Initialize Project</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/Projects.jsx**

```jsx
import { useState } from 'react'
import { usePermissions } from '../contexts/PermissionsContext'
import { useProjects } from '../hooks/useProjects'
import ProjectRow from '../components/projects/ProjectRow'
import CreateProjectModal from '../components/modals/CreateProjectModal'

export default function Projects() {
  const { hasPermission } = usePermissions()
  const { projects, loading, createProject } = useProjects()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.lead?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="content-block">
        <div className="block-header">
          <h3 className="block-title">All Architecture Projects</h3>
          <div className="navbar-actions">
            <input
              type="text"
              className="modal-input"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200, padding: '6px 12px' }}
            />
            {hasPermission('canCreateProjects') && (
              <button className="action-btn primary" onClick={() => setShowModal(true)}>
                <i className="fa-solid fa-plus"></i> New Project
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="project-list-table">
            <thead>
              <tr>
                <th>Project Name &amp; Client</th>
                <th>Lead</th>
                <th>Phase</th>
                <th>Task Status</th>
                <th>Progress</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No projects found.</td></tr>
              ) : filtered.map(p => <ProjectRow key={p.id} project={p} />)}
            </tbody>
          </table>
        </div>
      </div>

      <CreateProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={createProject}
      />
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/ src/pages/Projects.jsx src/components/modals/CreateProjectModal.jsx
git commit -m "feat: add projects list page with search and create modal"
```

---

## Task 11: Kanban Board

**Files:**
- Create: `src/components/kanban/KanbanBoard.jsx`
- Create: `src/components/kanban/KanbanColumn.jsx`
- Create: `src/components/kanban/TaskCard.jsx`

- [ ] **Step 1: Create src/components/kanban/TaskCard.jsx**

```jsx
export default function TaskCard({ task, canEdit, onDragStart, onClick }) {
  const isOverdue = task.status !== 'completed' && new Date(task.deadline) < new Date()
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
        <span className={`priority-tag priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
        <span className={`phase-badge phase-${task.phase.toLowerCase()}`} style={{ fontSize: 9, padding: '2px 4px' }}>{task.phase}</span>
      </div>
      <div className="card-title">{task.title}</div>
      <div className="card-desc">{task.description}</div>

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
        <div className={`card-deadline${isOverdue ? ' overdue' : ''}`}>
          <i className={`fa-solid ${isOverdue ? 'fa-triangle-exclamation' : 'fa-calendar-days'}`}></i>
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

- [ ] **Step 2: Create src/components/kanban/KanbanColumn.jsx**

```jsx
import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo: { label: 'To Do', cssClass: 'todo' },
  inprogress: { label: 'In Progress', cssClass: 'inprogress' },
  inreview: { label: 'In Review', cssClass: 'inreview' },
  completed: { label: 'Completed', cssClass: 'completed' },
}

export default function KanbanColumn({ status, tasks, canEdit, onDragStart, onDrop, onTaskClick }) {
  const config = COLUMN_CONFIG[status]

  return (
    <div className="kanban-column">
      <div className={`column-header ${config.cssClass}`}>
        <span className="column-title">{config.label}</span>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div
        className="kanban-cards-wrapper"
        onDragOver={e => e.preventDefault()}
        onDrop={() => onDrop(status)}
      >
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '30px 10px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            No active tasks
          </div>
        ) : tasks.map(t => (
          <TaskCard key={t.id} task={t} canEdit={canEdit} onDragStart={onDragStart} onClick={onTaskClick} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/kanban/KanbanBoard.jsx**

```jsx
import { useState } from 'react'
import KanbanColumn from './KanbanColumn'

const STATUSES = ['todo', 'inprogress', 'inreview', 'completed']

export default function KanbanBoard({ tasks, canEdit, onStatusChange, onTaskClick }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  function handleDrop(newStatus) {
    if (!draggedTaskId) return
    onStatusChange(draggedTaskId, newStatus)
    setDraggedTaskId(null)
  }

  return (
    <div className="project-boards-container">
      {STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter(t => t.status === status)}
          canEdit={canEdit}
          onDragStart={setDraggedTaskId}
          onDrop={handleDrop}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/kanban/
git commit -m "feat: add kanban board with drag-and-drop columns and task cards"
```

---

## Task 12: WorkLogList + CommentThread

**Files:**
- Create: `src/components/worklogs/WorkLogList.jsx`
- Create: `src/components/collaboration/CommentThread.jsx`

- [ ] **Step 1: Create src/components/worklogs/WorkLogList.jsx**

```jsx
export default function WorkLogList({ workLogs, canLog, onLogWork }) {
  return (
    <div className="content-block">
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h3 className="block-title"><i className="fa-solid fa-clock"></i> Daily Work Details &amp; Timesheets</h3>
        {canLog && (
          <button className="action-btn primary" onClick={onLogWork}>
            <i className="fa-solid fa-plus"></i> Post Daily Log
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 40, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            No work details recorded yet.
          </div>
        ) : workLogs.map(wl => (
          <div key={wl.id} className="work-log-item">
            <div className="work-log-header">
              <span><strong>{wl.user?.name}</strong> on <em>{wl.task?.title || 'General Milestone'}</em></span>
              <span className="time-badge">{wl.duration} {wl.unit}</span>
            </div>
            <div className="work-log-notes">"{wl.notes}"</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Log Date: {new Date(wl.date).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/collaboration/CommentThread.jsx**

```jsx
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function CommentThread({ comments, projectId, canComment, onAddComment }) {
  const { profile } = useAuth()
  const [text, setText] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    await onAddComment({ projectId, authorId: profile.id, text: text.trim() })
    setText('')
  }

  async function handleQuickFeedback(type) {
    const msg = type === 'approve'
      ? '✅ CLIENT UPDATE: Approve Active Deliverables. I authorize proceeding to the next stage.'
      : '⚠️ CLIENT UPDATE: Request Revision. Revisions requested. Please review the design changes in progress.'
    await onAddComment({ projectId, authorId: profile.id, text: msg })
  }

  return (
    <div className="dashboard-split">
      <div className="content-block" style={{ gridColumn: 'span 2' }}>
        <div className="block-header">
          <h3 className="block-title"><i className="fa-solid fa-comments"></i> Direct Feedback Channel</h3>
        </div>

        <div className="comments-container" style={{ maxHeight: 450 }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>No messages yet.</div>
          ) : comments.map(c => {
            const role = c.author?.role || 'architect'
            const badgeClass = role === 'principal' ? 'admin' : role
            const isApproval = c.text.includes('Approve Active Deliverables')
            const isRevision = c.text.includes('Request Revision')
            const borderStyle = isApproval
              ? 'border-left: 3px solid var(--status-completed); background: rgba(5,150,105,0.04)'
              : isRevision
              ? 'border-left: 3px solid var(--priority-high); background: rgba(220,38,38,0.04)'
              : ''

            return (
              <div key={c.id} className="comment-card" style={{ ...(borderStyle ? { borderLeft: borderStyle.split(';')[0].split(':')[1].trim(), background: borderStyle.split(';')[1]?.split(':')[1]?.trim() } : {}) }}>
                <div className="comment-meta">
                  <span className="comment-author">
                    {c.author?.name}
                    <span className={`comment-author-badge ${badgeClass}`}>{role}</span>
                  </span>
                  <span className="comment-time">
                    {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            )
          })}
        </div>

        {canComment ? (
          <div className="comment-input-area">
            <form onSubmit={handleSubmit}>
              <textarea
                className="modal-textarea"
                placeholder="Add feedback or request design decisions..."
                style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }}
                value={text}
                onChange={e => setText(e.target.value)}
                required
              />
              <div className="flex-between">
                {profile?.role === 'client' && (
                  <>
                    <button type="button" className="action-btn" onClick={() => handleQuickFeedback('approve')}>
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--status-completed)' }}></i> Approve Deliverables
                    </button>
                    <button type="button" className="action-btn" onClick={() => handleQuickFeedback('revision')}>
                      <i className="fa-solid fa-rotate-left" style={{ color: 'var(--priority-high)' }}></i> Request Revision
                    </button>
                  </>
                )}
                <button type="submit" className="action-btn primary" style={{ marginLeft: 'auto' }}>Post Comment</button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, paddingTop: 15, borderTop: '1px solid var(--border-color)' }}>
            Your account does not have permission to post messages.
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/worklogs/ src/components/collaboration/
git commit -m "feat: add work log list and comment thread components"
```

---

## Task 13: Task Modals

**Files:**
- Create: `src/components/modals/AddTaskModal.jsx`
- Create: `src/components/modals/TaskDetailModal.jsx`
- Create: `src/components/modals/LogWorkModal.jsx`

- [ ] **Step 1: Create src/components/modals/AddTaskModal.jsx**

```jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PHASES = ['SD', 'DD', 'CD', 'CA']

export default function AddTaskModal({ open, projectId, onClose, onCreated }) {
  const [architects, setArchitects] = useState([])
  const [form, setForm] = useState({ title: '', description: '', phase: 'SD', assigneeId: '', priority: 'Medium', deadline: '' })

  useEffect(() => {
    if (!open) return
    supabase.from('profiles').select('id,name,role').then(({ data }) => {
      setArchitects((data || []).filter(u => u.role !== 'client' && u.role !== 'pending'))
    })
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await onCreated({
      projectId, title: form.title, description: form.description,
      phase: form.phase, assigneeId: form.assigneeId, priority: form.priority, deadline: form.deadline
    })
    if (!error) { setForm({ title: '', description: '', phase: 'SD', assigneeId: '', priority: 'Medium', deadline: '' }); onClose() }
  }

  if (!open) return null

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Create Project Task</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-form-group">
              <label className="modal-label">Task Title</label>
              <input type="text" className="modal-input" placeholder="e.g. 3D Elevation Rendering" required value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Architectural Phase</label>
              <select className="modal-select" value={form.phase} onChange={e => setForm(f => ({...f,phase:e.target.value}))}>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Assignee</label>
              <select className="modal-select" required value={form.assigneeId} onChange={e => setForm(f => ({...f,assigneeId:e.target.value}))}>
                <option value="">Select assignee...</option>
                {architects.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Priority</label>
              <select className="modal-select" value={form.priority} onChange={e => setForm(f => ({...f,priority:e.target.value}))}>
                {['Low','Medium','High'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Deadline</label>
              <input type="date" className="modal-input" required value={form.deadline} onChange={e => setForm(f => ({...f,deadline:e.target.value}))} />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Description</label>
              <textarea className="modal-textarea" placeholder="Detail drawing requirements or review guidelines..." value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/modals/TaskDetailModal.jsx**

```jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TaskDetailModal({ open, task, projectId, onClose, canEdit, canLogWork, onSubtaskToggle, onAddSubtask, onOpenLogWork }) {
  const [architects, setArchitects] = useState([])
  const [newSub, setNewSub] = useState({ title: '', assigneeId: '', deadline: '' })

  useEffect(() => {
    if (!open) return
    supabase.from('profiles').select('id,name,role').then(({ data }) => {
      setArchitects((data || []).filter(u => u.role !== 'client' && u.role !== 'pending'))
    })
  }, [open])

  if (!open || !task) return null

  async function handleAddSubtask() {
    if (!newSub.title || !newSub.deadline) return alert('Fill in subtask title and deadline.')
    await onAddSubtask({ taskId: task.id, title: newSub.title, assigneeId: newSub.assigneeId, deadline: newSub.deadline })
    setNewSub({ title: '', assigneeId: '', deadline: '' })
  }

  const subtasks = task.subtasks || []

  return (
    <div className="modal-overlay open">
      <div className="modal-card" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3 className="modal-title">{task.title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{task.description || 'No details specified.'}</p>

          <div className="detail-modal-tabs-container">
            <div>
              <h4 className="modal-label" style={{ marginBottom: 10 }}><i className="fa-solid fa-list-check"></i> Subtasks &amp; Assignees</h4>

              {canEdit && (
                <div className="subtask-editor-row" style={{ marginBottom: 16 }}>
                  <input type="text" className="modal-input" placeholder="Subtask item..." style={{ padding: '6px 10px', fontSize: 13 }} value={newSub.title} onChange={e => setNewSub(s => ({...s,title:e.target.value}))} />
                  <select className="modal-select" style={{ padding: '6px 10px', fontSize: 13 }} value={newSub.assigneeId} onChange={e => setNewSub(s => ({...s,assigneeId:e.target.value}))}>
                    <option value="">Assignee</option>
                    {architects.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <input type="date" className="modal-input" style={{ padding: '6px 10px', fontSize: 13 }} value={newSub.deadline} onChange={e => setNewSub(s => ({...s,deadline:e.target.value}))} />
                  <button type="button" className="action-btn primary" onClick={handleAddSubtask} style={{ padding: '6px 12px', fontSize: 12, height: 38 }}><i className="fa-solid fa-plus"></i></button>
                </div>
              )}

              <div className="subtasks-panel-list">
                {subtasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 15 }}>No subtasks created.</div>
                ) : subtasks.map(s => (
                  <div key={s.id} className="subtask-panel-item">
                    <div className={`subtask-item-mini${s.status === 'completed' ? ' completed' : ''}`} style={{ gap: 12, width: '100%' }}>
                      <div className="subtask-left">
                        <input type="checkbox" checked={s.status === 'completed'} disabled={!canEdit} onChange={e => onSubtaskToggle(s.id, e.target.checked ? 'completed' : 'todo')} style={{ accentColor: 'var(--accent-teal)' }} />
                        <span>{s.title}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Due {s.deadline ? new Date(s.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '–'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {canLogWork && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <h4 className="modal-label"><i className="fa-solid fa-clock"></i> Task Work Logs</h4>
                  <button type="button" className="action-btn" onClick={() => { onClose(); onOpenLogWork(task.id) }} style={{ padding: '4px 10px', fontSize: 11 }}>
                    <i className="fa-solid fa-plus"></i> Log Work
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/modals/LogWorkModal.jsx**

```jsx
import { useState } from 'react'

export default function LogWorkModal({ open, tasks, projectId, preselectedTaskId, onClose, onSubmit }) {
  const [form, setForm] = useState({ taskId: preselectedTaskId || '', duration: '', unit: 'hours', date: new Date().toISOString().substring(0, 10), notes: '' })

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await onSubmit({
      projectId, taskId: form.taskId, duration: parseFloat(form.duration),
      unit: form.unit, date: form.date, notes: form.notes
    })
    if (!error) { setForm({ taskId: '', duration: '', unit: 'hours', date: new Date().toISOString().substring(0, 10), notes: '' }); onClose() }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Log Daily Work Details</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-form-group">
              <label className="modal-label">Select Task Milestone</label>
              <select className="modal-select" required value={form.taskId} onChange={e => setForm(f => ({...f,taskId:e.target.value}))}>
                <option value="">Select task...</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="modal-label">Time Spent</label>
                  <input type="number" step="0.1" className="modal-input" placeholder="e.g. 4" required value={form.duration} onChange={e => setForm(f => ({...f,duration:e.target.value}))} />
                </div>
                <div>
                  <label className="modal-label">Unit</label>
                  <select className="modal-select" value={form.unit} onChange={e => setForm(f => ({...f,unit:e.target.value}))}>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Date of Work</label>
              <input type="date" className="modal-input" required value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))} />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">What work was done?</label>
              <textarea className="modal-textarea" placeholder="Describe sketches completed, design adjustments..." required value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Post Work Log</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/modals/AddTaskModal.jsx src/components/modals/TaskDetailModal.jsx src/components/modals/LogWorkModal.jsx
git commit -m "feat: add task, task detail, and work log modals"
```

---

## Task 14: ProjectDetail Page

**Files:**
- Create: `src/components/projects/PhaseTimeline.jsx`
- Create: `src/pages/ProjectDetail.jsx`

- [ ] **Step 1: Create src/components/projects/PhaseTimeline.jsx**

```jsx
const PHASES = ['SD', 'DD', 'CD', 'CA']
const PHASE_LABELS = { SD: 'Schematic Design (SD)', DD: 'Design Development (DD)', CD: 'Construction Documents (CD)', CA: 'Construction Admin (CA)' }

export default function PhaseTimeline({ currentPhase, canChange, onPhaseChange }) {
  const currentIdx = PHASES.indexOf(currentPhase)

  return (
    <div className="phases-timeline">
      {PHASES.map((ph, idx) => {
        const statusClass = idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : ''
        return (
          <div
            key={ph}
            className={`phase-step ${statusClass}`}
            title={PHASE_LABELS[ph]}
            onClick={canChange ? () => onPhaseChange(ph) : undefined}
            style={canChange ? { cursor: 'pointer' } : {}}
          >
            <div className="phase-dot">{idx + 1}</div>
            <div className="phase-title-text">{ph}</div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/ProjectDetail.jsx**

```jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionsContext'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useComments } from '../hooks/useComments'
import { useWorkLogs } from '../hooks/useWorkLogs'
import PhaseTimeline from '../components/projects/PhaseTimeline'
import KanbanBoard from '../components/kanban/KanbanBoard'
import WorkLogList from '../components/worklogs/WorkLogList'
import CommentThread from '../components/collaboration/CommentThread'
import AddTaskModal from '../components/modals/AddTaskModal'
import TaskDetailModal from '../components/modals/TaskDetailModal'
import LogWorkModal from '../components/modals/LogWorkModal'
import StatCard from '../components/dashboard/StatCard'

const PHASES = { SD: 'Schematic Design (SD)', DD: 'Design Development (DD)', CD: 'Construction Documents (CD)', CA: 'Construction Admin (CA)' }
const TABS = ['overview', 'tasks', 'worklogs', 'collab']

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const { projects, updateProject } = useProjects()
  const { tasks, createTask, updateTaskStatus, createSubtask, updateSubtaskStatus } = useTasks(projectId)
  const { comments, addComment } = useComments(projectId)
  const { workLogs, logWork, getTotalHours } = useWorkLogs(projectId)

  const [activeTab, setActiveTab] = useState('overview')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showLogWork, setShowLogWork] = useState(false)
  const [preselectedTaskId, setPreselectedTaskId] = useState(null)

  const project = projects.find(p => p.id === projectId)

  if (!project) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading project...</div>

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalSubs = tasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0)
  const completedSubs = tasks.reduce((s, t) => s + (t.subtasks?.filter(s => s.status === 'completed').length || 0), 0)

  function handleTaskClick(task) {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }

  function handleOpenLogWorkFromTask(taskId) {
    setPreselectedTaskId(taskId)
    setShowLogWork(true)
  }

  async function handleLogWork(data) {
    return await logWork({ ...data, userId: profile.id })
  }

  return (
    <>
      {/* Header */}
      <div className="project-header-panel" style={{ marginBottom: 20 }}>
        <div className="flex-between">
          <div>
            <h2 className="brand-title" style={{ marginBottom: 5 }}>{project.name}</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 800, fontSize: 14 }}>{project.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className={`phase-badge phase-${project.phase.toLowerCase()}`} style={{ fontSize: 14, padding: '6px 12px' }}>
              {PHASES[project.phase]}
            </span>
            <button className="action-btn" onClick={() => navigate('/projects')}>
              <i className="fa-solid fa-arrow-left"></i> Back
            </button>
            {hasPermission('canCreateTasks') && (
              <button className="action-btn primary" onClick={() => setShowAddTask(true)}>
                <i className="fa-solid fa-plus"></i> Add Task
              </button>
            )}
          </div>
        </div>

        <PhaseTimeline
          currentPhase={project.phase}
          canChange={hasPermission('canChangePhase')}
          onPhaseChange={ph => updateProject(projectId, { phase: ph })}
        />

        <div className="project-meta-grid">
          <div className="project-meta-item">
            <span className="project-meta-label">Commission Owner</span>
            <span className="project-meta-value">{project.client?.name || '–'}{project.client?.company ? ` (${project.client.company})` : ''}</span>
          </div>
          <div className="project-meta-item">
            <span className="project-meta-label">Design Lead</span>
            <span className="project-meta-value">{project.lead?.name || '–'}</span>
          </div>
          {hasPermission('canViewFinancials') && (
            <div className="project-meta-item">
              <span className="project-meta-label">Budget</span>
              <span className="project-meta-value" style={{ color: 'var(--accent-gold)' }}>${(project.budget || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="project-meta-item">
            <span className="project-meta-label">Target Date</span>
            <span className="project-meta-value">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '–'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="project-tabs">
        {[['overview','fa-circle-nodes','Overview Dashboard'],['tasks','fa-list-check','Design Board'],['worklogs','fa-clock-rotate-left','Timesheet & Work Logs'],['collab','fa-comments','Client Collaboration']].map(([tab, icon, label]) => (
          <button key={tab} className={`project-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            <i className={`fa-solid ${icon}`}></i> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="project-tab-contents">
        {activeTab === 'overview' && (
          <>
            <div className="dashboard-grid">
              <StatCard title="Overall Progress" value={`${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%`} desc={`${completedTasks}/${tasks.length} milestones resolved`} color="teal" />
              <StatCard title="Subtask Deliverables" value={`${completedSubs}/${totalSubs}`} desc={`${totalSubs > 0 ? Math.round((completedSubs/totalSubs)*100) : 0}% subtask completion`} color="green" />
              <StatCard title="Total Effort Logged" value={`${getTotalHours()} hrs`} desc="From team timesheet submissions" color="gold" />
              <StatCard title="Active Phase" value={project.phase} desc={PHASES[project.phase]} color="purple" />
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <div className="content-block">
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3 className="block-title"><i className="fa-solid fa-cubes"></i> Interactive Kanban Board</h3>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click cards to manage subtasks</span>
            </div>
            <KanbanBoard
              tasks={tasks}
              canEdit={hasPermission('canCreateTasks')}
              onStatusChange={(taskId, status) => updateTaskStatus(taskId, status)}
              onTaskClick={handleTaskClick}
            />
          </div>
        )}

        {activeTab === 'worklogs' && (
          <WorkLogList
            workLogs={workLogs}
            canLog={hasPermission('canLogWork')}
            onLogWork={() => setShowLogWork(true)}
          />
        )}

        {activeTab === 'collab' && (
          <CommentThread
            comments={comments}
            projectId={projectId}
            canComment={hasPermission('canModerateComments')}
            onAddComment={addComment}
          />
        )}
      </div>

      {/* Modals */}
      <AddTaskModal
        open={showAddTask}
        projectId={projectId}
        onClose={() => setShowAddTask(false)}
        onCreated={createTask}
      />
      <TaskDetailModal
        open={showTaskDetail}
        task={selectedTask}
        projectId={projectId}
        canEdit={hasPermission('canCreateTasks')}
        canLogWork={hasPermission('canLogWork')}
        onClose={() => setShowTaskDetail(false)}
        onSubtaskToggle={(subtaskId, status) => updateSubtaskStatus(subtaskId, status)}
        onAddSubtask={createSubtask}
        onOpenLogWork={handleOpenLogWorkFromTask}
      />
      <LogWorkModal
        open={showLogWork}
        tasks={tasks}
        projectId={projectId}
        preselectedTaskId={preselectedTaskId}
        onClose={() => { setShowLogWork(false); setPreselectedTaskId(null) }}
        onSubmit={handleLogWork}
      />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/PhaseTimeline.jsx src/pages/ProjectDetail.jsx
git commit -m "feat: add project detail page with 4-tab workspace"
```

---

## Task 15: Team Page + ACL Matrix + User Modals

**Files:**
- Create: `src/components/modals/AddClientModal.jsx`
- Create: `src/components/modals/AddStaffModal.jsx`
- Create: `src/pages/Team.jsx`

- [ ] **Step 1: Create src/components/modals/AddClientModal.jsx**

```jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AddClientModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', company: '', email: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const initials = form.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    const { error: err } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      name: form.name, company: form.company, email: form.email,
      role: 'client', avatar_initials: initials
    })
    if (err) { setError(err.message); return }
    setForm({ name: '', company: '', email: '' })
    onAdded?.()
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Register New Client</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <p style={{ color: 'var(--priority-high)', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            {[['name','Full Name','text','e.g. Richard Hendricks'],['company','Company / Organization','text','e.g. Pied Piper LLC'],['email','Email Address','email','r.hendricks@piedpiper.com']].map(([key,label,type,ph]) => (
              <div className="modal-form-group" key={key}>
                <label className="modal-label">{label}</label>
                <input type={type} className="modal-input" placeholder={ph} required value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} />
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>The client will log in via Google using this email address.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Register Client</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/modals/AddStaffModal.jsx**

```jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AddStaffModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', role: 'architect', email: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const initials = form.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    const { error: err } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      name: form.name, email: form.email, role: form.role, avatar_initials: initials
    })
    if (err) { setError(err.message); return }
    setForm({ name: '', role: 'architect', email: '' })
    onAdded?.()
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Register Studio Staff</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <p style={{ color: 'var(--priority-high)', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div className="modal-form-group">
              <label className="modal-label">Full Name</label>
              <input type="text" className="modal-input" placeholder="e.g. Walter Gropius" required value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Studio Role</label>
              <select className="modal-select" value={form.role} onChange={e => setForm(f => ({...f,role:e.target.value}))}>
                <option value="architect">Project Architect / Manager</option>
                <option value="principal">Principal Architect (Admin)</option>
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Email Address</label>
              <input type="email" className="modal-input" placeholder="w.gropius@arcflow.com" required value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Staff will log in via Google using this email address.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Register Staff</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/Team.jsx**

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionsContext'
import AddClientModal from '../components/modals/AddClientModal'
import AddStaffModal from '../components/modals/AddStaffModal'

const PERMISSION_DEFS = [
  { key: 'can_create_projects', label: 'Initialize New Commission Projects', desc: 'Allows creating projects from dashboard/portfolio panels.' },
  { key: 'can_create_tasks', label: 'Manage Milestones & Subtasks', desc: 'Allows creating tasks, subtasks, and shifting Kanban statuses.' },
  { key: 'can_log_work', label: 'Submit Daily Work Logs', desc: 'Allows entering hours/days spent on tasks.' },
  { key: 'can_change_phase', label: 'Progress Project Phases (SD-CA)', desc: 'Allows advancing active project development phases.' },
  { key: 'can_view_financials', label: 'View Portfolio Valuation & Budgets', desc: 'Allows seeing financial metrics and budget figures.' },
  { key: 'can_moderate_comments', label: 'Post Collaboration Feed Comments', desc: 'Allows writing feedback messages.' },
]

export default function Team() {
  const { profile } = useAuth()
  const { permissions, updatePermission } = usePermissions()
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddStaff, setShowAddStaff] = useState(false)

  async function loadData() {
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('projects').select('id,name,client_id,lead_id'),
    ])
    setUsers(u || [])
    setProjects(p || [])
  }

  useEffect(() => { loadData() }, [])

  const staff = users.filter(u => u.role !== 'client' && u.role !== 'pending')
  const clients = users.filter(u => u.role === 'client')

  function getAssignedProjects(userId) {
    return projects.filter(p => p.client_id === userId || p.lead_id === userId).map(p => p.name).join(', ') || 'None'
  }

  async function handleRoleChange(userId, newRole) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    loadData()
  }

  return (
    <>
      {/* Staff Table */}
      <div className="content-block" style={{ marginBottom: 24 }}>
        <div className="block-header">
          <h3 className="block-title">Studio Staff & Architects</h3>
          {profile?.role === 'principal' && (
            <button className="action-btn primary" onClick={() => setShowAddStaff(true)}>
              <i className="fa-solid fa-plus"></i> Add Staff
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="project-list-table">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Assigned Projects</th>{profile?.role === 'principal' && <th>Change Role</th>}</tr></thead>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients Table */}
      <div className="content-block">
        <div className="block-header">
          <h3 className="block-title">Client Accounts</h3>
          {profile?.role === 'principal' && (
            <button className="action-btn primary" onClick={() => setShowAddClient(true)}>
              <i className="fa-solid fa-plus"></i> Add Client
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="project-list-table">
            <thead><tr><th>Client Name</th><th>Company</th><th>Email</th><th>Associated Project</th></tr></thead>
            <tbody>
              {clients.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.company || '–'}</td>
                  <td>{u.email}</td>
                  <td style={{ fontSize: 12 }}>{getAssignedProjects(u.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Users */}
      {profile?.role === 'principal' && users.filter(u => u.role === 'pending').length > 0 && (
        <div className="content-block" style={{ marginTop: 24 }}>
          <div className="block-header">
            <h3 className="block-title" style={{ color: 'var(--priority-medium)' }}>
              <i className="fa-solid fa-clock"></i> Pending Access Requests
            </h3>
          </div>
          <table className="project-list-table">
            <thead><tr><th>Email</th><th>Signed Up</th><th>Assign Role</th></tr></thead>
            <tbody>
              {users.filter(u => u.role === 'pending').map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <select className="modal-select" style={{ fontSize: 12, padding: '4px 8px', height: 'auto' }} defaultValue="" onChange={e => { if (e.target.value) handleRoleChange(u.id, e.target.value) }}>
                      <option value="" disabled>Assign role...</option>
                      <option value="architect">architect</option>
                      <option value="principal">principal</option>
                      <option value="client">client</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACL Permissions Matrix — Principal only */}
      {profile?.role === 'principal' && (
        <div className="content-block" style={{ marginTop: 24 }}>
          <div className="block-header" style={{ marginBottom: 12 }}>
            <h3 className="block-title"><i className="fa-solid fa-user-shield"></i> Studio Role Access Control (ACL)</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Principals always retain full privileges. Configure capabilities for Architects and Clients below.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="permissions-matrix-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Key</th>
                  <th>Architect Role</th>
                  <th>Client Role</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_DEFS.map(def => {
                  const archVal = permissions.architect?.[def.key] ?? false
                  const clientVal = permissions.client?.[def.key] ?? false
                  return (
                    <tr key={def.key}>
                      <td>
                        <strong>{def.label}</strong><br />
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{def.desc}</span>
                      </td>
                      <td><code>{def.key}</code></td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={archVal} onChange={e => updatePermission('architect', def.key, e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={clientVal} onChange={e => updatePermission('client', def.key, e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} onAdded={loadData} />
      <AddStaffModal open={showAddStaff} onClose={() => setShowAddStaff(false)} onAdded={loadData} />
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Team.jsx src/components/modals/AddClientModal.jsx src/components/modals/AddStaffModal.jsx
git commit -m "feat: add team page with pending users, ACL matrix, and staff/client modals"
```

---

## Task 16: Deployment Config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

This ensures React Router deep links work on Vercel (all routes serve `index.html`):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- [ ] **Step 2: Run dev server to verify app starts**

```bash
npm run dev
```

Expected: Vite server starts on `http://localhost:5173`, Login page renders with Google button.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 6 permissions tests pass.

- [ ] **Step 4: Build for production**

```bash
npm run build
```

Expected: `dist/` folder created, no errors.

- [ ] **Step 5: Enable Google OAuth in Supabase**

1. Go to Supabase dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
6. Copy Client ID + Secret back into Supabase Google provider settings

- [ ] **Step 6: Deploy to Vercel**

1. Push repo to GitHub: `git push origin main`
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select this repo
4. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click Deploy

Expected: App live at `https://your-project.vercel.app`

- [ ] **Step 7: Add Vercel domain to Supabase auth**

In Supabase → Authentication → URL Configuration:
- Site URL: `https://your-project.vercel.app`
- Redirect URLs: `https://your-project.vercel.app`

- [ ] **Step 8: Final commit**

```bash
git add vercel.json
git commit -m "feat: add vercel deployment config"
git push origin main
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Google OAuth auth flow (Tasks 4, 5)
- ✅ `pending` role + role assignment by Principal (Task 15)
- ✅ All 7 DB tables with RLS (Task 2)
- ✅ Dashboard with stats + activity feed (Task 9)
- ✅ Projects list + search + create (Task 10)
- ✅ Kanban board with drag-and-drop (Task 11)
- ✅ Work logs / timesheets (Task 12, 13)
- ✅ Client collaboration comments (Task 12)
- ✅ Role permissions matrix (Task 7, 15)
- ✅ Realtime via Supabase channels (Tasks 8 hooks)
- ✅ Free deployment on Vercel + Supabase (Task 16)
- ✅ Preserved ArcFlow dark theme (Task 1 — CSS copy)

**Type consistency:**
- `useProjects` returns `createProject`, `updateProject` — both called correctly in Projects.jsx and ProjectDetail.jsx ✅
- `useTasks` returns `createTask`, `updateTaskStatus`, `createSubtask`, `updateSubtaskStatus` — all called in ProjectDetail.jsx ✅
- `usePermissions` returns `hasPermission(key)` as a function — called throughout with string keys ✅
- Permission keys in PermissionsContext use camelCase (`canCreateProjects`) matching permissions.js ✅
- DB column names use snake_case (`can_create_projects`) — Team.jsx ACL matrix uses snake_case for DB updates ✅

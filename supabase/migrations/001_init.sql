-- Run this in: Supabase Dashboard > SQL Editor
-- After running, also run 002_seed_permissions.sql
-- Then update your own profile: UPDATE profiles SET role = 'principal' WHERE email = 'your-email@gmail.com';

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

-- Helper: get project IDs accessible to current architect
-- (defined here, after projects + tasks tables exist)
CREATE OR REPLACE FUNCTION get_architect_project_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM projects WHERE lead_id = auth.uid()
  UNION
  SELECT DISTINCT project_id FROM tasks WHERE assignee_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

-- PROJECTS
CREATE POLICY "projects_principal" ON projects FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "projects_architect_select" ON projects FOR SELECT USING (
  get_user_role() = 'architect' AND id IN (SELECT get_architect_project_ids())
);
CREATE POLICY "projects_client_select" ON projects FOR SELECT USING (
  get_user_role() = 'client' AND client_id = auth.uid()
);

-- TASKS
CREATE POLICY "tasks_principal" ON tasks FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "tasks_architect" ON tasks FOR ALL USING (
  get_user_role() = 'architect' AND project_id IN (SELECT get_architect_project_ids())
);
CREATE POLICY "tasks_client_select" ON tasks FOR SELECT USING (
  get_user_role() = 'client' AND
  project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
);

-- SUBTASKS
CREATE POLICY "subtasks_principal" ON subtasks FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "subtasks_architect" ON subtasks FOR ALL USING (
  get_user_role() = 'architect' AND
  task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT get_architect_project_ids()))
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

CREATE POLICY "comments_architect_select" ON comments FOR SELECT USING (
  get_user_role() = 'architect' AND project_id IN (SELECT get_architect_project_ids())
);
CREATE POLICY "comments_architect_insert" ON comments FOR INSERT WITH CHECK (
  get_user_role() = 'architect' AND project_id IN (SELECT get_architect_project_ids()) AND author_id = auth.uid()
);

CREATE POLICY "comments_client_select" ON comments FOR SELECT USING (
  get_user_role() = 'client' AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
);
CREATE POLICY "comments_client_insert" ON comments FOR INSERT WITH CHECK (
  get_user_role() = 'client' AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()) AND author_id = auth.uid()
);

-- PERMISSIONS (read-only for non-principals)
CREATE POLICY "permissions_principal" ON permissions FOR ALL USING (get_user_role() = 'principal');
CREATE POLICY "permissions_read" ON permissions FOR SELECT USING (true);

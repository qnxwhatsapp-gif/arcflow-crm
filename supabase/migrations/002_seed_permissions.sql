INSERT INTO permissions (role, can_create_projects, can_create_tasks, can_log_work, can_change_phase, can_view_financials, can_moderate_comments)
VALUES
  ('architect', false, true, true, true, false, true),
  ('client',    false, false, false, false, false, true)
ON CONFLICT (role) DO NOTHING;

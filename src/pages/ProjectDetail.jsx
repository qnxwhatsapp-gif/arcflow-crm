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
import DeadlineBadge from '../components/ui/DeadlineBadge'

const PHASES = { SD: 'Schematic Design (SD)', DD: 'Design Development (DD)', CD: 'Construction Documents (CD)', CA: 'Construction Admin (CA)' }

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
  const completedSubs = tasks.reduce((s, t) => s + (t.subtasks?.filter(sub => sub.status === 'completed').length || 0), 0)

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

      <div className="project-tabs">
        {[['overview','fa-circle-nodes','Overview Dashboard'],['tasks','fa-list-check','Design Board'],['worklogs','fa-clock-rotate-left','Timesheet & Work Logs'],['collab','fa-comments','Client Collaboration']].map(([tab, icon, label]) => (
          <button key={tab} className={`project-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            <i className={`fa-solid ${icon}`}></i> {label}
          </button>
        ))}
      </div>

      <div className="project-tab-contents">
        {activeTab === 'overview' && (
          <>
            <div className="dashboard-grid">
              <StatCard title="Overall Progress" value={`${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%`} desc={`${completedTasks}/${tasks.length} milestones resolved`} color="teal" />
              <StatCard title="Subtask Deliverables" value={`${completedSubs}/${totalSubs}`} desc={`${totalSubs > 0 ? Math.round((completedSubs/totalSubs)*100) : 0}% subtask completion`} color="green" />
              <StatCard title="Total Effort Logged" value={`${getTotalHours()} hrs`} desc="From team timesheet submissions" color="gold" />
              <StatCard title="Active Phase" value={project.phase} desc={PHASES[project.phase]} color="purple" />
            </div>
            {tasks.length > 0 && (
              <div className="content-block" style={{ marginTop: 20 }}>
                <div className="block-header">
                  <h3 className="block-title"><i className="fa-solid fa-list-check"></i> Task Overview</h3>
                </div>
                <table className="project-list-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id} className="project-row" onClick={() => handleTaskClick(t)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>{t.title}</strong>
                            {t.status !== 'completed' && <DeadlineBadge deadline={t.deadline} />}
                          </div>
                        </td>
                        <td><span className={`priority-tag priority-${(t.priority || 'medium').toLowerCase()}`}>{t.priority || 'Medium'}</span></td>
                        <td><span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{t.status}</span></td>
                        <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

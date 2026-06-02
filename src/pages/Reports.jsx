// src/pages/Reports.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Chart } from 'chart.js/auto'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProjects } from '../hooks/useProjects'
import DeadlineBadge from '../components/ui/DeadlineBadge'
import { computePortfolioStats, generatePortfolioPdf } from '../utils/generatePortfolioPdf'
import { computeWorkSummary, generateProjectPdf } from '../utils/generateProjectPdf' // used in ProjectHealthTab (Task 5)

const PHASES = ['SD', 'DD', 'CD', 'CA']
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
      const { data, error } = await supabase
        .from('tasks')
        .select('id, project_id, status, deadline')
      if (error) {
        console.error('Failed to fetch tasks for portfolio:', error)
      }
      setAllTasks(data || [])
      setLoadingTasks(false)
    }
    fetchAllTasks()
  }, [])

  const stats = useMemo(
    () => computePortfolioStats(projects, allTasks),
    [projects, allTasks]
  )

  // Build / rebuild charts when data is ready
  useEffect(() => {
    if (loadingTasks || !donutRef.current || !barRef.current) return

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
  }, [stats, loadingTasks])

  if (loadingTasks) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading portfolio data…</div>

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
    }).catch(err => {
      console.error('Failed to fetch project health data:', err)
      setLoading(false)
    })
  }, [selectedProjectId])

  // Build / rebuild donut chart
  useEffect(() => {
    if (!donutRef.current || !selectedProjectId) return
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

// ─── Page Shell ───────────────────────────────────────────────────────────

export default function Reports() {
  const { profile } = useAuth()
  const { projects, loading } = useProjects()
  const [activeTab, setActiveTab] = useState('portfolio')

  if (profile?.role !== 'principal') return <Navigate to="/dashboard" replace />
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

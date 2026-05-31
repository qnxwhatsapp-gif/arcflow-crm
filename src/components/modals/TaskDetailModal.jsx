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

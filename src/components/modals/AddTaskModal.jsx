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

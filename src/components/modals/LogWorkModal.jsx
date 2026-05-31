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

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

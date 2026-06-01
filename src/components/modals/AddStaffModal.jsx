import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const STAFF_ROLES = [
  { value: 'architect', label: 'Project Architect' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'intern', label: 'Intern / Junior' },
  { value: 'principal', label: 'Principal Architect (Admin)' },
]

export default function AddStaffModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', role: 'architect', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated. Please refresh and try again.')
        setLoading(false)
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({ email: form.email, name: form.name, role: form.role }),
        }
      )

      const json = await res.json()

      if (!res.ok || json.error) {
        console.error('create-user error:', res.status, json)
        setError(json.error || `Server error (${res.status})`)
        setLoading(false)
        return
      }

      setSuccess(`✓ ${form.name} registered. A password-reset email has been sent to ${form.email}.`)
      setForm({ name: '', role: 'architect', email: '' })
      onAdded?.()
      setTimeout(() => { setSuccess(''); onClose() }, 3000)
    } catch (err) {
      console.error('AddStaffModal unexpected error:', err)
      setError(err.message || 'Unexpected error. Please try again.')
    }

    setLoading(false)
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
            {success && <p style={{ color: 'var(--status-completed)', marginBottom: 12, fontSize: 13 }}>{success}</p>}

            <div className="modal-form-group">
              <label className="modal-label">Full Name</label>
              <input
                type="text" className="modal-input" placeholder="e.g. Walter Gropius"
                required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Studio Role</label>
              <select
                className="modal-select" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                {STAFF_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Email Address</label>
              <input
                type="email" className="modal-input" placeholder="w.gropius@studio.com"
                required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              A password-setup email will be sent so they can create their own password.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary" disabled={loading}>
              {loading ? 'Creating...' : 'Register Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

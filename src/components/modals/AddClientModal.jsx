import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AddClientModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', company: '', email: '' })
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
          body: JSON.stringify({
            email: form.email,
            name: form.name,
            role: 'client',
            company: form.company,
          }),
        }
      )

      const json = await res.json()

      if (!res.ok || json.error) {
        console.error('create-user error:', res.status, json)
        setError(json.error || `Server error (${res.status})`)
        setLoading(false)
        return
      }

      setSuccess(`✓ ${form.name} registered. A password-setup email has been sent to ${form.email}.`)
      setForm({ name: '', company: '', email: '' })
      onAdded?.()
      setTimeout(() => { setSuccess(''); onClose() }, 3000)
    } catch (err) {
      console.error('AddClientModal unexpected error:', err)
      setError(err.message || 'Unexpected error. Please try again.')
    }

    setLoading(false)
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
            {success && <p style={{ color: 'var(--status-completed)', marginBottom: 12, fontSize: 13 }}>{success}</p>}

            {[
              ['name', 'Full Name', 'text', 'e.g. Richard Hendricks'],
              ['company', 'Company / Organization', 'text', 'e.g. Pied Piper LLC'],
              ['email', 'Email Address', 'email', 'r.hendricks@piedpiper.com'],
            ].map(([key, label, type, ph]) => (
              <div className="modal-form-group" key={key}>
                <label className="modal-label">{label}</label>
                <input
                  type={type} className="modal-input" placeholder={ph}
                  required value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              A password-setup email will be sent so the client can log in.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary" disabled={loading}>
              {loading ? 'Creating...' : 'Register Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

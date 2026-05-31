import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AddClientModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', company: '', email: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const initials = form.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    const { error: err } = await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      name: form.name, company: form.company, email: form.email,
      role: 'client', avatar_initials: initials
    })
    if (err) { setError(err.message); return }
    setForm({ name: '', company: '', email: '' })
    onAdded?.()
    onClose()
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
            {[['name','Full Name','text','e.g. Richard Hendricks'],['company','Company / Organization','text','e.g. Pied Piper LLC'],['email','Email Address','email','r.hendricks@piedpiper.com']].map(([key,label,type,ph]) => (
              <div className="modal-form-group" key={key}>
                <label className="modal-label">{label}</label>
                <input type={type} className="modal-input" placeholder={ph} required value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} />
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>The client will log in via Google using this email address.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Register Client</button>
          </div>
        </form>
      </div>
    </div>
  )
}

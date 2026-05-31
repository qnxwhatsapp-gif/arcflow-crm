import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [architects, setArchitects] = useState([])
  const [form, setForm] = useState({ name: '', clientId: '', leadId: '', budget: '', deadline: '', description: '' })

  useEffect(() => {
    if (!open) return
    supabase.from('profiles').select('id,name,role,company').then(({ data }) => {
      setClients((data || []).filter(u => u.role === 'client'))
      setArchitects((data || []).filter(u => u.role !== 'client' && u.role !== 'pending'))
    })
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await onCreated({
      name: form.name, description: form.description,
      budget: parseFloat(form.budget) || 0, deadline: form.deadline,
      clientId: form.clientId, leadId: form.leadId, createdBy: profile.id
    })
    if (!error) { setForm({ name: '', clientId: '', leadId: '', budget: '', deadline: '', description: '' }); onClose() }
  }

  if (!open) return null

  return (
    <div className="modal-overlay open">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Create New Project</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {[['name','Project Name','text','e.g. Helix Residential Villa'],['budget','Budget ($)','number','e.g. 150000'],['deadline','Deadline','date','']].map(([key,label,type,ph]) => (
              <div className="modal-form-group" key={key}>
                <label className="modal-label">{label}</label>
                <input type={type} className="modal-input" placeholder={ph} required value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} />
              </div>
            ))}
            <div className="modal-form-group">
              <label className="modal-label">Client</label>
              <select className="modal-select" required value={form.clientId} onChange={e => setForm(f => ({...f,clientId:e.target.value}))}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Lead Architect</label>
              <select className="modal-select" required value={form.leadId} onChange={e => setForm(f => ({...f,leadId:e.target.value}))}>
                <option value="">Select lead...</option>
                {architects.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Description</label>
              <textarea className="modal-textarea" placeholder="Brief project description..." value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="action-btn primary">Initialize Project</button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select(`*, client:client_id(id,name,company,avatar_initials), lead:lead_id(id,name,avatar_initials)`)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()

    const channel = supabase.channel('projects-changes-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function createProject({ name, description, phase = 'SD', budget, deadline, clientId, leadId, createdBy }) {
    const { data, error } = await supabase.from('projects').insert({
      name, description, phase, budget, deadline,
      client_id: clientId, lead_id: leadId, created_by: createdBy
    }).select().single()
    if (!error) setProjects(prev => [data, ...prev])
    return { data, error }
  }

  async function updateProject(id, updates) {
    const { error } = await supabase.from('projects').update(updates).eq('id', id)
    if (!error) setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    return { error }
  }

  return { projects, loading, createProject, updateProject, refetch: fetchProjects }
}

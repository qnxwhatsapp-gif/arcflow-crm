import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useWorkLogs(projectId) {
  const [workLogs, setWorkLogs] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchWorkLogs() {
    if (!projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('work_logs')
      .select(`*, user:user_id(id,name,avatar_initials), task:task_id(id,title)`)
      .eq('project_id', projectId)
      .order('date', { ascending: false })
    setWorkLogs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchWorkLogs()

    const channel = supabase.channel(`work-logs-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_logs', filter: `project_id=eq.${projectId}` }, fetchWorkLogs)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId])

  async function logWork({ taskId, userId, duration, unit, date, notes }) {
    const { error } = await supabase.from('work_logs').insert({
      project_id: projectId, task_id: taskId, user_id: userId,
      duration, unit, date, notes
    })
    if (!error) fetchWorkLogs()
    return { error }
  }

  function getTotalHours() {
    return workLogs.reduce((sum, w) => {
      return sum + (w.unit === 'days' ? (parseFloat(w.duration) || 0) * 8 : (parseFloat(w.duration) || 0))
    }, 0)
  }

  return { workLogs, loading, logWork, getTotalHours }
}

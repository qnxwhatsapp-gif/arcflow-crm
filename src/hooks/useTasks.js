import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchTasks() {
    if (!projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('tasks')
      .select(`*, assignee:assignee_id(id,name,avatar_initials), subtasks(*)`)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()

    const channel = supabase.channel(`tasks-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId])

  async function createTask({ title, description, phase, assigneeId, priority, deadline }) {
    const { data, error } = await supabase.from('tasks').insert({
      project_id: projectId, title, description, phase,
      assignee_id: assigneeId, priority, deadline
    }).select(`*, assignee:assignee_id(id,name,avatar_initials), subtasks(*)`).single()
    if (!error) setTasks(prev => [...prev, data])
    return { data, error }
  }

  async function updateTaskStatus(taskId, status) {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    return { error }
  }

  async function createSubtask({ taskId, title, assigneeId, deadline }) {
    const { error } = await supabase.from('subtasks').insert({
      task_id: taskId, title, assignee_id: assigneeId, deadline
    })
    if (!error) fetchTasks()
    return { error }
  }

  async function updateSubtaskStatus(subtaskId, status) {
    const { error } = await supabase.from('subtasks').update({ status }).eq('id', subtaskId)
    if (!error) fetchTasks()
    return { error }
  }

  return { tasks, loading, createTask, updateTaskStatus, createSubtask, updateSubtaskStatus, refetch: fetchTasks }
}

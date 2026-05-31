import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useComments(projectId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchComments() {
    if (!projectId) { setLoading(false); return }
    const { data } = await supabase
      .from('comments')
      .select(`*, author:author_id(id,name,avatar_initials,role)`)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()

    const channel = supabase.channel(`comments-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` }, fetchComments)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId])

  async function addComment({ projectId, authorId, text }) {
    const { error } = await supabase.from('comments').insert({ project_id: projectId, author_id: authorId, text })
    return { error }
  }

  return { comments, loading, addComment }
}

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function CommentThread({ comments, projectId, canComment, onAddComment }) {
  const { profile } = useAuth()
  const [text, setText] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    await onAddComment({ projectId, authorId: profile.id, text: text.trim() })
    setText('')
  }

  async function handleQuickFeedback(type) {
    const msg = type === 'approve'
      ? '✅ CLIENT UPDATE: Approve Active Deliverables. I authorize proceeding to the next stage.'
      : '⚠️ CLIENT UPDATE: Request Revision. Revisions requested. Please review the design changes in progress.'
    await onAddComment({ projectId, authorId: profile.id, text: msg })
  }

  return (
    <div className="dashboard-split">
      <div className="content-block" style={{ gridColumn: 'span 2' }}>
        <div className="block-header">
          <h3 className="block-title"><i className="fa-solid fa-comments"></i> Direct Feedback Channel</h3>
        </div>

        <div className="comments-container" style={{ maxHeight: 450 }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>No messages yet.</div>
          ) : comments.map(c => {
            const role = c.author?.role || 'architect'
            const badgeClass = role === 'principal' ? 'admin' : role
            const isApproval = c.text.includes('Approve Active Deliverables')
            const isRevision = c.text.includes('Request Revision')
            const cardStyle = isApproval
              ? { borderLeft: '3px solid var(--status-completed)', background: 'rgba(5,150,105,0.04)' }
              : isRevision
              ? { borderLeft: '3px solid var(--priority-high)', background: 'rgba(220,38,38,0.04)' }
              : {}

            return (
              <div key={c.id} className="comment-card" style={cardStyle}>
                <div className="comment-meta">
                  <span className="comment-author">
                    {c.author?.name}
                    <span className={`comment-author-badge ${badgeClass}`}>{role}</span>
                  </span>
                  <span className="comment-time">
                    {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            )
          })}
        </div>

        {canComment ? (
          <div className="comment-input-area">
            <form onSubmit={handleSubmit}>
              <textarea
                className="modal-textarea"
                placeholder="Add feedback or request design decisions..."
                style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }}
                value={text}
                onChange={e => setText(e.target.value)}
                required
              />
              <div className="flex-between">
                {profile?.role === 'client' && (
                  <>
                    <button type="button" className="action-btn" onClick={() => handleQuickFeedback('approve')}>
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--status-completed)' }}></i> Approve Deliverables
                    </button>
                    <button type="button" className="action-btn" onClick={() => handleQuickFeedback('revision')}>
                      <i className="fa-solid fa-rotate-left" style={{ color: 'var(--priority-high)' }}></i> Request Revision
                    </button>
                  </>
                )}
                <button type="submit" className="action-btn primary" style={{ marginLeft: 'auto' }}>Post Comment</button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, paddingTop: 15, borderTop: '1px solid var(--border-color)' }}>
            Your account does not have permission to post messages.
          </div>
        )}
      </div>
    </div>
  )
}

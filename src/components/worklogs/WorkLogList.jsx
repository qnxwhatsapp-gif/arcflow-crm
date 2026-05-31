export default function WorkLogList({ workLogs, canLog, onLogWork }) {
  return (
    <div className="content-block">
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h3 className="block-title"><i className="fa-solid fa-clock"></i> Daily Work Details &amp; Timesheets</h3>
        {canLog && (
          <button className="action-btn primary" onClick={onLogWork}>
            <i className="fa-solid fa-plus"></i> Post Daily Log
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 40, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            No work details recorded yet.
          </div>
        ) : workLogs.map(wl => (
          <div key={wl.id} className="work-log-item">
            <div className="work-log-header">
              <span><strong>{wl.user?.name}</strong> on <em>{wl.task?.title || 'General Milestone'}</em></span>
              <span className="time-badge">{wl.duration} {wl.unit}</span>
            </div>
            <div className="work-log-notes">"{wl.notes}"</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Log Date: {new Date(wl.date).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

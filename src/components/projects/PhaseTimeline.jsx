const PHASES = ['SD', 'DD', 'CD', 'CA']
const PHASE_LABELS = { SD: 'Schematic Design (SD)', DD: 'Design Development (DD)', CD: 'Construction Documents (CD)', CA: 'Construction Admin (CA)' }

export default function PhaseTimeline({ currentPhase, canChange, onPhaseChange }) {
  const currentIdx = PHASES.indexOf(currentPhase)

  return (
    <div className="phases-timeline">
      {PHASES.map((ph, idx) => {
        const statusClass = idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : ''
        return (
          <div
            key={ph}
            className={`phase-step ${statusClass}`}
            title={PHASE_LABELS[ph]}
            onClick={canChange ? () => onPhaseChange(ph) : undefined}
            style={canChange ? { cursor: 'pointer' } : {}}
          >
            <div className="phase-dot">{idx + 1}</div>
            <div className="phase-title-text">{ph}</div>
          </div>
        )
      })}
    </div>
  )
}

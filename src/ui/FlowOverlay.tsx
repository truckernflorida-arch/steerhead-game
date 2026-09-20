/**
 * Brief = non-blocking plan card (does not cover clock/locator).
 * Debrief = full-screen overlay (unchanged).
 */
import type { TickSnap } from '#/game/ticksnap'
import type { JobCard } from '#/game/levels'

type Props = {
  snap: TickSnap
  level: JobCard
  onRetry: () => void
}

export function FlowOverlay({ snap, level, onRetry }: Props) {
  if (snap.phase === 'brief') {
    return (
      <aside className="flow-plan" aria-label="Job plan">
        <h2>{level.bibleTitle}</h2>
        <p className="flow-lesson">
          Lesson 1 · Read the ground · Set clock · Then push
        </p>
        <p className="flow-callout">
          Set the clock face before your first rod / push. Clock and locator stay
          live — nothing advances until you Spud in.
        </p>
        <ul className="flow-list">
          <li>
            Soil: <strong>Dirt / light_fill</strong> (mud locked green)
          </li>
          <li>
            Shot: {level.bore?.length_ft ?? 120} ft · target depth{' '}
            {level.bore?.targetDepth_ft ?? 6} ft
          </li>
          <li>APWA: yellow gas clearance · blue water (brief)</li>
          <li>
            Pass: exit window · gradeHold ≥70% · ≤1 panic dogleg warn
          </li>
          <li>Fail teaches steer death — not the dirt</li>
        </ul>
        <ol className="flow-steps">
          <li>Rotate first rod — set clock face (drag or 1–12)</li>
          <li>Match locator depth/pitch to plan</li>
          <li>Spud in / Start push — then thrust (W / slider)</li>
        </ol>
      </aside>
    )
  }

  if (snap.phase === 'debrief' && snap.debrief) {
    const d = snap.debrief
    const causeLabel = snap.causes[0]?.label
    return (
      <div className="flow-overlay" role="dialog" aria-label="Debrief">
        <div className="flow-card">
          <h2>{d.headline}</h2>
          {causeLabel ? <p className="flow-cause">{causeLabel}</p> : null}
          <p>{d.body}</p>
          {d.ticketScore != null ? (
            <p className="flow-score">
              Ticket score:{' '}
              <strong>{(d.ticketScore * 100).toFixed(0)}%</strong>
            </p>
          ) : null}
          {level.debriefChecklist && level.debriefChecklist.length > 0 ? (
            <ul className="flow-list compact">
              {level.debriefChecklist.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="flow-primary" onClick={onRetry}>
            Retry yard
          </button>
        </div>
      </div>
    )
  }

  return null
}

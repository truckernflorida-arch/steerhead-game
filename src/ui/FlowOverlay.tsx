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
          Lesson 1 · Curved road ROW · Locates · Target steering
        </p>
        <p className="flow-callout">
          Set <strong>rig entry pitch</strong>, then{' '}
          <strong>Drill first rod in</strong>. Once piloting, every rod has{' '}
          <strong>Just drill (straight)</strong> or{' '}
          <strong>Push N ft @ clock</strong> — both always available. Yellow gas
          sits <strong>slightly right of the ROW</strong> — take a small{' '}
          <strong>clock 9 (COME LEFT)</strong> for a rod or two, then return to
          12.
        </p>
        <ul className="flow-list">
          <li>
            Soil: <strong>Dirt / light_fill</strong> (mud locked green)
          </li>
          <li>
            Shot: {level.bore?.length_ft ?? 120} ft curved ROW · target depth{' '}
            {level.bore?.targetDepth_ft ?? 6} ft · 10 ft rods
          </li>
          <li>
            APWA: yellow gas <strong>+2 ft right @ sta 40</strong> (clock 9 to
            clear) · blue water parallel · orange telecom
          </li>
          <li>
            Hard fail: utility strike · too deep (bury). Over-steer = warn only.
          </li>
          <li>
            Grade hold soft-scores the ticket — not a mystery fail when clear
            of locates. Drill OR Push every rod.
          </li>
        </ul>
        <ol className="flow-steps">
          <li>Raise/lower rig — set entry pitch (slider)</li>
          <li>Drill first rod in — then Drill or Push on every rod</li>
          <li>
            Near sta 40: COME LEFT (9) to miss offset gas · then back to 12
          </li>
          <li>Watch TARGET STEERING + Ground / Oblique locate maps</li>
        </ol>
      </aside>
    )
  }

  if (snap.phase === 'debrief' && snap.debrief) {
    const d = snap.debrief
    const causeLabel = snap.causes[0]?.label
    const soft =
      snap.flags.wrongDaylightSoft ||
      (snap.flags.daylight && !snap.flags.taughtFail)
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
              {soft && !snap.flags.taughtFail ? (
                <span className="flow-score-note"> · soft grade notes OK</span>
              ) : null}
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

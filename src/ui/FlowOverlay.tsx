/**
 * Brief = non-blocking plan card (does not cover clock/locator).
 * Debrief = full-screen overlay (unchanged).
 * S01 brief APWA from Bot 5 locate tickets (gas 3.5 on CL; water 3.0 L −8).
 */
import type { TickSnap } from '#/game/ticksnap'
import type { JobCard } from '#/game/levels'

type Props = {
  snap: TickSnap
  level: JobCard
  onRetry: () => void
}

function ticketLines(level: JobCard): string[] {
  const raw = (level.locateTickets ?? level.apwa ?? []) as Array<
    Record<string, unknown>
  >
  if (!raw.length) {
    return [
      'YELLOW · GAS · 3.5 ft · sta 40 · on CL (crosses path)',
      'BLUE · WATER · 3.0 ft · parallel LEFT of CL ~8 ft',
    ]
  }
  return raw.map((m) => {
    if (typeof m.ticketText === 'string' && m.ticketText) return m.ticketText
    const color = String(m.apwa ?? m.color ?? '').toUpperCase()
    const label = String(m.label ?? m.type ?? 'UTIL').toUpperCase()
    const depth = Number(m.depth_ft ?? 0).toFixed(1)
    const offset =
      m.offsetFromCL_ft != null
        ? Number(m.offsetFromCL_ft)
        : m.offset_ft != null
          ? Number(m.offset_ft)
          : 0
    const sta = m.sta_ft != null ? ` · sta ${m.sta_ft}` : ''
    const side =
      m.crossesCL === false || m.role === 'parallel_brief_only'
        ? ` · parallel ${offset < 0 ? 'LEFT' : 'RIGHT'} ~${Math.abs(offset)} ft`
        : Math.abs(offset) < 0.15
          ? ' · on CL (crosses path)'
          : ` · offset ${offset >= 0 ? '+' : ''}${offset} ft`
    return `${color} · ${label} · ${depth} ft${sta}${side}`
  })
}

export function FlowOverlay({ snap, level, onRetry }: Props) {
  if (snap.phase === 'brief') {
    const tickets = ticketLines(level)
    return (
      <aside className="flow-plan" aria-label="Job plan">
        <h2>{level.bibleTitle}</h2>
        <p className="flow-lesson">
          Lesson 1 · Curved road ROW · Locate depth tickets · Target steering
        </p>
        <p className="flow-callout">
          Set <strong>rig entry pitch</strong>, then{' '}
          <strong>Drill first rod in</strong>. Once piloting, every rod has{' '}
          <strong>Just drill (straight)</strong> or{' '}
          <strong>Push N ft @ clock</strong> — both always available. Yellow gas
          crosses the path on CL at <strong>3.5 ft</strong> — stay under it (≥3
          ft under / ≥18 in envelope). Blue water is paint-only, parallel LEFT.
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
            Locate tickets:
            <ul className="flow-list compact">
              {tickets.map((t) => (
                <li key={t}>
                  <strong>{t}</strong>
                </li>
              ))}
            </ul>
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
            Near sta 40: hold grade under gas (3.5 ft ticket) · do not climb
            into the yellow
          </li>
          <li>Watch WALKOVER depth tickets + TARGET STEERING</li>
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

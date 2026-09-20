/**
 * Falcon F5–style remote display — pitch / clock-roll / depth / entry grade.
 * Reads TickSnap.hud only; never invents TF_* / RV_*.
 * Concept: DCI Falcon F5 walkover remote bezel.
 */
import type { TickSnap } from '#/game/ticksnap'
import { angleDegToHour } from '#/game/input/clock'

type Props = { snap: TickSnap }

/** Pitch (+ dive into ground, − climb) → up/down sense for the bezel. */
function pitchSense(pitchDeg: number): { arrow: string; label: string } {
  if (pitchDeg > 0.15) return { arrow: '↓', label: 'DIVE' }
  if (pitchDeg < -0.15) return { arrow: '↑', label: 'CLIMB' }
  return { arrow: '→', label: 'LEVEL' }
}

export function FalconRemote({ snap }: Props) {
  const h = snap.hud
  const pitch = h.pitchDeg
  const depth = h.depthFt ?? 0
  const clockDeg = h.clockAngleDeg ?? 180
  const hour = h.clockHour ?? angleDegToHour(clockDeg)
  const bars = h.signalBars ?? 5
  /** Entry / grade into ground — same physics pitch (path inclination). */
  const entryGrade = pitch
  const sense = pitchSense(pitch)
  const handRad = ((clockDeg - 90) * Math.PI) / 180
  const hx = 40 + Math.cos(handRad) * 26
  const hy = 40 + Math.sin(handRad) * 26

  return (
    <section className="falcon-remote" aria-label="Falcon F5 style remote">
      <header className="falcon-bezel-head">
        <span className="falcon-brand">FALCON F5</span>
        <span className="falcon-stubs" aria-hidden>
          <span className="falcon-batt" title="Battery">
            <i style={{ width: '72%' }} />
          </span>
          <span className="signal-bars falcon-sig" aria-label={`${bars} bars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={i < bars ? 'on' : ''} />
            ))}
          </span>
        </span>
      </header>

      <div className="falcon-screen">
        <div className="falcon-pitch-block">
          <span className="falcon-label">PITCH</span>
          <div className="falcon-pitch-row">
            <span className="falcon-sense" aria-hidden>
              {sense.arrow}
            </span>
            <span className="falcon-pitch-val">
              {pitch >= 0 ? '+' : ''}
              {pitch.toFixed(1)}
              <span className="falcon-unit">°</span>
            </span>
          </div>
          <span className="falcon-sense-tag">{sense.label}</span>
        </div>

        <div className="falcon-mid">
          <div className="falcon-clock-mini" aria-label={`Clock ${hour} o'clock`}>
            <svg viewBox="0 0 80 80" width="72" height="72">
              <circle cx="40" cy="40" r="36" className="falcon-clock-ring" />
              <circle cx="40" cy="40" r="30" className="falcon-clock-dial" />
              {[12, 3, 6, 9].map((n) => {
                const a = ((n % 12) * 30 - 90) * (Math.PI / 180)
                const tx = 40 + Math.cos(a) * 22
                const ty = 40 + Math.sin(a) * 22
                return (
                  <text
                    key={n}
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="falcon-clock-num"
                  >
                    {n}
                  </text>
                )
              })}
              <line
                x1="40"
                y1="40"
                x2={hx}
                y2={hy}
                className="falcon-clock-hand"
                strokeLinecap="round"
              />
              <circle cx="40" cy="40" r="3" className="falcon-clock-hub" />
            </svg>
            <span className="falcon-label">CLOCK / ROLL</span>
            <span className="falcon-hour">
              {hour} O&apos;CLOCK · {Math.round(clockDeg)}°
            </span>
          </div>

          <div className="falcon-side-meters">
            <div className="falcon-meter">
              <span className="falcon-label">DEPTH</span>
              <span className="falcon-depth">
                {depth.toFixed(1)}
                <span className="falcon-unit"> FT</span>
              </span>
              <span className="falcon-sub">cover</span>
            </div>
            <div className="falcon-meter">
              <span className="falcon-label">ENTRY / GRADE</span>
              <span className="falcon-entry">
                {entryGrade >= 0 ? '+' : ''}
                {entryGrade.toFixed(1)}
                <span className="falcon-unit">°</span>
              </span>
              <span className="falcon-sub">into ground</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="falcon-foot">REMOTE · SNAP ONLY · NO FAIL INVENT</footer>
    </section>
  )
}

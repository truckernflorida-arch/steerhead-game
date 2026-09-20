/**
 * Walkover locator — depth / pitch / station / APWA + TARGET STEERING cues.
 * Concept: concepts/01-locator-clock-hud.png — TickSnap only.
 */
import type { TickSnap } from '#/game/ticksnap'

type Props = { snap: TickSnap }

export function LocatorPanel({ snap }: Props) {
  const h = snap.hud
  const depth = h.depthFt ?? 0
  const pitch = h.pitchDeg
  const station = h.stationFt ?? 0
  const lateral = h.lateralFt ?? 0
  const bars = h.signalBars ?? 5
  const apwa = h.apwa ?? []
  const target = h.targetDepthFt ?? 6
  const ts = h.targetSteering
  const lengthGuess = Math.max(120, station + 10)
  const rodLabel =
    h.rodIndex != null && h.rodTotal != null
      ? `Rod ${h.rodIndex} of ${h.rodTotal}`
      : null

  return (
    <section className="locator-panel" aria-label="Walkover locator">
      <header className="locator-head">
        <span>WALKOVER LOCATOR</span>
        <span className="locator-mode">TARGET STEERING</span>
        <span className="locator-target">target {target.toFixed(0)} ft</span>
      </header>

      {ts ? (
        <div
          className={`locator-steer locator-steer-${ts.pitchBand}`}
          role="status"
        >
          <div className="locator-steer-row">
            <span>
              TGT {ts.targetPitchDeg >= 0 ? '+' : ''}
              {ts.targetPitchDeg.toFixed(1)}°
            </span>
            <span>
              ACT {ts.actualPitchDeg >= 0 ? '+' : ''}
              {ts.actualPitchDeg.toFixed(1)}°
            </span>
            <span>
              Δ {ts.pitchErrorDeg >= 0 ? '+' : ''}
              {ts.pitchErrorDeg.toFixed(1)}°
            </span>
          </div>
          <p className="locator-cue">
            {ts.cueLabel}
            {ts.suggestHour != null ? ` → ${ts.suggestHour} o'clock` : ''}
          </p>
        </div>
      ) : null}

      <div className="locator-map" aria-hidden>
        <div className="locator-path locator-path-curve" />
        <div
          className="locator-head-dot"
          style={{
            left: `${Math.min(92, 8 + (station / lengthGuess) * 80)}%`,
          }}
        />
        {apwa.map((m, i) => {
          const offset = m.offset_ft ?? 0
          // Map L/R: center ~40%, right offset down, left offset up
          let topPct = 40
          if (m.role) topPct = 70
          else if (Math.abs(offset) > 0.15) {
            topPct = Math.max(12, Math.min(72, 40 + offset * 8))
          }
          return (
            <div
              key={`${m.type}-${i}`}
              className={`apwa-mark apwa-${m.color}${Math.abs(offset) > 0.4 ? ' apwa-offset' : ''}`}
              style={{
                left: `${m.sta_ft != null ? 8 + (m.sta_ft / lengthGuess) * 80 : 30 + i * 25}%`,
                top: `${topPct}%`,
              }}
              title={m.label}
            >
              {m.type.slice(0, 1).toUpperCase()}
            </div>
          )
        })}
      </div>

      <div className="locator-readouts">
        <div className="locator-readout">
          <span className="lr-label">DEPTH</span>
          <span className="lr-value cyan">{depth.toFixed(1)} FT</span>
        </div>
        <div className="locator-readout">
          <span className="lr-label">PITCH</span>
          <span className="lr-value">{pitch.toFixed(1)}°</span>
        </div>
        <div className="locator-readout">
          <span className="lr-label">STATION</span>
          <span className="lr-value">{station.toFixed(0)} FT</span>
        </div>
        <div className="locator-readout">
          <span className="lr-label">L / R</span>
          <span className="lr-value">
            {lateral >= 0 ? '+' : ''}
            {lateral.toFixed(1)} FT
          </span>
        </div>
        <div className="locator-readout">
          <span className="lr-label">ROD</span>
          <span className="lr-value">{rodLabel ?? '—'}</span>
        </div>
        <div className="locator-readout">
          <span className="lr-label">SIGNAL</span>
          <span className="signal-bars" aria-label={`${bars} bars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={i < bars ? 'on' : ''} />
            ))}
          </span>
        </div>
      </div>

      <div className="apwa-legend">
        {apwa.map((m, i) => (
          <span key={i} className={`apwa-chip apwa-${m.color}`}>
            {m.label}
          </span>
        ))}
      </div>
    </section>
  )
}

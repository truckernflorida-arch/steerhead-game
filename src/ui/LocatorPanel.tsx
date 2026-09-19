/**
 * Walkover locator — depth / pitch / station / APWA from TickSnap only.
 * Concept: concepts/01-locator-clock-hud.png
 */
import type { TickSnap } from '#/game/ticksnap'

type Props = { snap: TickSnap }

export function LocatorPanel({ snap }: Props) {
  const h = snap.hud
  const depth = h.depthFt ?? 0
  const pitch = h.pitchDeg
  const station = h.stationFt ?? 0
  const bars = h.signalBars ?? 5
  const apwa = h.apwa ?? []
  const target = h.targetDepthFt ?? 6

  return (
    <section className="locator-panel" aria-label="Walkover locator">
      <header className="locator-head">
        <span>WALKOVER LOCATOR</span>
        <span className="locator-target">target {target.toFixed(0)} ft</span>
      </header>

      <div className="locator-map" aria-hidden>
        <div className="locator-path" />
        <div
          className="locator-head-dot"
          style={{ left: `${Math.min(92, 8 + (station / 120) * 80)}%` }}
        />
        {apwa.map((m, i) => (
          <div
            key={`${m.type}-${i}`}
            className={`apwa-mark apwa-${m.color}`}
            style={{
              left: `${m.sta_ft != null ? 8 + (m.sta_ft / 120) * 80 : 30 + i * 25}%`,
              top: m.role ? '70%' : '40%',
            }}
            title={m.label}
          >
            {m.type.slice(0, 1).toUpperCase()}
          </div>
        ))}
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

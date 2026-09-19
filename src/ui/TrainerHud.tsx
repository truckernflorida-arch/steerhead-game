/**
 * TrainerHud — consumes TickSnap ONLY.
 * Renders symptoms + verb chips + meters from snap helpers.
 * Never branches on TF_* / RV_* ids.
 */
import {
  primaryMeters,
  statusStrip,
  verbChips,
  type TrainerHudProps,
  type VerbId,
} from '#/game/ticksnap'

export function TrainerHud({
  snap,
  causeLog,
  onVerb,
  detailOpen,
  onToggleDetail,
}: TrainerHudProps) {
  const symptoms = statusStrip(snap)
  const verbs = verbChips(snap)
  const meters = primaryMeters(snap)

  return (
    <aside className="trainer-hud" aria-label="Trainer HUD">
      <div className="hud-meta">
        <span className="hud-phase">{snap.phase}</span>
        <span className="hud-t">t={snap.t.toFixed(1)}s</span>
        {snap.flags.taughtFail ? (
          <span className="hud-flag">taught-fail active</span>
        ) : null}
      </div>

      <div className="status-strip" role="status">
        {symptoms.length === 0 ? (
          <span className="symptom info">ALL CLEAR</span>
        ) : (
          symptoms.map((s) => (
            <span key={s.key} className={`symptom ${s.severity}`}>
              {s.label}
            </span>
          ))
        )}
      </div>

      <div className="meters">
        {meters.map((m) => (
          <div key={m.key} className="meter">
            <span className="meter-label">{m.label}</span>
            <span className="meter-value">
              {typeof m.value === 'number' ? m.value.toFixed(1) : String(m.value)}
            </span>
          </div>
        ))}
      </div>

      {detailOpen ? (
        <div className="meters detail">
          {snap.hud.packOff != null ? (
            <div className="meter">
              <span className="meter-label">Pack-off</span>
              <span className="meter-value">{snap.hud.packOff.toFixed(2)}</span>
            </div>
          ) : null}
          {snap.hud.mixerOn != null ? (
            <div className="meter">
              <span className="meter-label">Mixer</span>
              <span className="meter-value">{snap.hud.mixerOn ? 'ON' : 'OFF'}</span>
            </div>
          ) : null}
          {snap.hud.cleanIndex != null ? (
            <div className="meter">
              <span className="meter-label">CleanIndex</span>
              <span className="meter-value">{snap.hud.cleanIndex.toFixed(0)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="verb-chips">
        {verbs.map((v) => (
          <button
            key={v.key}
            type="button"
            className="verb-chip"
            disabled={!v.enabled}
            onClick={() => onVerb?.(v.key as VerbId)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="hud-actions">
        <button type="button" onClick={onToggleDetail}>
          {detailOpen ? 'Hide detail' : 'Show detail'}
        </button>
        {causeLog && causeLog.length > 0 ? (
          <span className="cause-log-count">{causeLog.length} cause events</span>
        ) : null}
      </div>
    </aside>
  )
}

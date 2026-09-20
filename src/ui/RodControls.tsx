/**
 * Rod / push marker + deliberate push + Just drill (straight).
 * Every rod (incl. rod 1 once in pilot): Drill OR Push — both always available.
 * Brief-only label "Drill first rod in" never sticks after start.
 */
import { angleDegToHour } from '#/game/input/clock'
import { DEFAULT_PUSH_FT, ROD_LENGTH_FT } from '#/game/state'

type Props = {
  clockAngleDeg: number
  pushLengthFt: number
  onPushLengthFt: (ft: number) => void
  pendingPushFt: number
  phase: string
  rodIndex: number
  rodTotal: number
  /** Discrete steered push at current clock (all rods in pilot) */
  onPushStep: () => void
  /** Hold: straight drill (no clock steer) */
  onDrillDown: () => void
  onDrillUp: () => void
  drillActive: boolean
  /** Brief only: start first rod from plan card / rod strip */
  onDrillFirstRod?: () => void
  /** Station along shot (ft) — used for first-rod remaining copy */
  stationFt?: number
}

const PUSH_OPTIONS = [1, 2, 3] as const

export function RodControls({
  clockAngleDeg,
  pushLengthFt,
  onPushLengthFt,
  pendingPushFt,
  phase,
  rodIndex,
  rodTotal,
  onPushStep,
  onDrillDown,
  onDrillUp,
  drillActive,
  onDrillFirstRod,
  stationFt = 0,
}: Props) {
  const hour = angleDegToHour(clockAngleDeg)
  const piloting = phase === 'pilot'
  const briefing = phase === 'brief'
  const pushing = pendingPushFt > 0.05
  const onFirstRod = rodIndex <= 1
  const firstRodRemaining = Math.max(0, ROD_LENGTH_FT - stationFt)
  const pushLabel = `Push ${pushLengthFt} ft @ ${hour} o'clock`

  let drillLabel = 'Just drill (straight)'
  if (piloting && onFirstRod && (pushing || drillActive)) {
    drillLabel = pushing
      ? `Drilling first rod… ${pendingPushFt.toFixed(1)} ft left`
      : `Drilling first rod… ${firstRodRemaining.toFixed(1)} ft left`
  } else if (piloting && onFirstRod) {
    drillLabel = 'Just drill (straight)'
  }

  return (
    <section className="rod-controls" aria-label="Rod and push controls">
      <div className="rod-marker" role="status">
        <span className="rod-marker-main">
          Rod {rodIndex} of {rodTotal} · {ROD_LENGTH_FT} ft rod
          {piloting
            ? ` · push ${pushLengthFt} ft @ ${hour} o'clock`
            : ' · set pitch, then drill first rod'}
        </span>
        {pushing ? (
          <span className="rod-marker-pending">
            {onFirstRod && drillActive
              ? `drilling first rod… ${pendingPushFt.toFixed(1)} ft left`
              : `pushing… ${pendingPushFt.toFixed(1)} ft left`}
          </span>
        ) : null}
        {drillActive && piloting && !pushing ? (
          <span className="rod-marker-drill">Just drill — straight / level</span>
        ) : null}
        {piloting ? (
          <span className="rod-marker-drill">
            Drill (straight) or Push N ft @ clock — both available
          </span>
        ) : null}
      </div>

      {piloting || briefing ? (
        <div className="rod-push-len" role="group" aria-label="Push length">
          <span className="rod-push-len-label">Push length</span>
          {PUSH_OPTIONS.map((ft) => (
            <button
              key={ft}
              type="button"
              className={
                pushLengthFt === ft ? 'rod-chip rod-chip-on' : 'rod-chip'
              }
              onClick={() => onPushLengthFt(ft)}
              disabled={false}
            >
              {ft} ft
            </button>
          ))}
        </div>
      ) : null}

      <div className="rod-actions">
        {briefing ? (
          <button
            type="button"
            className="rod-btn rod-btn-drill"
            onClick={() => onDrillFirstRod?.()}
            disabled={false}
            title="Set rig pitch, then Drill — clock optional for later push"
          >
            Drill first rod in
          </button>
        ) : (
          <>
            <button
              type="button"
              className="rod-btn rod-btn-push"
              onClick={onPushStep}
              disabled={!piloting || pushing || drillActive}
              title={
                piloting
                  ? `Advance ${pushLengthFt} ft at current clock face`
                  : 'Start the bore first'
              }
            >
              {pushLabel}
            </button>
            <button
              type="button"
              className={
                drillActive || (onFirstRod && pushing)
                  ? 'rod-btn rod-btn-drill rod-btn-drill-on'
                  : 'rod-btn rod-btn-drill'
              }
              disabled={!piloting || (pushing && !drillActive)}
              onPointerDown={(e) => {
                e.preventDefault()
                onDrillDown()
              }}
              onPointerUp={onDrillUp}
              onPointerLeave={onDrillUp}
              onPointerCancel={onDrillUp}
              title={
                piloting
                  ? onFirstRod && pushing
                    ? `Drilling first rod — ${pendingPushFt.toFixed(1)} ft left`
                    : 'Hold: straight / level drill (no steer)'
                  : 'Start the bore first'
              }
            >
              {drillLabel}
            </button>
          </>
        )}
      </div>
      <p className="rod-hint">
        {briefing
          ? `Brief: set entry pitch, then Drill first rod in (~${ROD_LENGTH_FT} ft). Once piloting, every rod has Just drill OR Push N ft @ clock.`
          : `Each ${ROD_LENGTH_FT} ft rod: Just drill (straight) or Push ${DEFAULT_PUSH_FT} ft @ clock. Clock optional on rod 1; both options always available in pilot.`}
      </p>
    </section>
  )
}

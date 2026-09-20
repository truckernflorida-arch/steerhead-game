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
  /** Tap: discrete straight drill (same length as Push, no clock) */
  onDrillStep: () => void
  /** Hold: continuous straight drill (no clock steer) */
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
  onDrillStep,
  onDrillDown,
  onDrillUp,
  drillActive,
  onDrillFirstRod,
  stationFt: _stationFt = 0,
}: Props) {
  const hour = angleDegToHour(clockAngleDeg)
  const piloting = phase === 'pilot'
  const briefing = phase === 'brief'
  const pushing = pendingPushFt > 0.05
  const onFirstRod = rodIndex <= 1
  const pushLabel = `Push ${pushLengthFt} ft @ ${hour} o'clock`


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
                drillActive || (onFirstRod && pushing && drillActive)
                  ? 'rod-btn rod-btn-drill rod-btn-drill-on'
                  : 'rod-btn rod-btn-drill'
              }
              disabled={!piloting || pushing}
              onClick={(e) => {
                e.preventDefault()
                onDrillStep()
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                // Mark hold; suppress synthetic click double-queue via data flag
                ;(e.currentTarget as HTMLButtonElement).dataset.holding = '1'
                e.currentTarget.setPointerCapture?.(e.pointerId)
                onDrillDown()
              }}
              onPointerUp={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                const held = el.dataset.holding === '1'
                delete el.dataset.holding
                onDrillUp()
                // If it was a quick tap, pointerup+click both fire — click handles discrete
                // If held >~180ms continuous already ran; click still ok (pending guard)
                void held
              }}
              onPointerCancel={onDrillUp}
              title={
                piloting
                  ? `Drill ${pushLengthFt} ft straight (tap) · hold for continuous`
                  : 'Start the bore first'
              }
            >
              {`Drill ${pushLengthFt} ft straight`}
            </button>
          </>
        )}
      </div>
      <p className="rod-hint">
        {briefing
          ? `Brief: set entry pitch, then Drill first rod in (~${ROD_LENGTH_FT} ft). Once piloting, every rod has Just drill OR Push N ft @ clock.`
          : `Each ${ROD_LENGTH_FT} ft rod: Drill N ft straight or Push ${DEFAULT_PUSH_FT} ft @ clock. Clock optional on rod 1; both options always available in pilot.`}
      </p>
    </section>
  )
}

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
  /** @deprecated Hold disabled — kept optional for API compat */
  onDrillDown?: () => void
  onDrillUp?: () => void
  drillActive: boolean
  /** Brief only: start first rod from plan card / rod strip */
  onDrillFirstRod?: () => void
  /** Station along shot (ft) — used for first-rod remaining copy */
  stationFt?: number
}

/** Steps within a 10 ft rod */
const PUSH_OPTIONS = [1, 2, 5, 10] as const

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
  onDrillDown: _onDrillDown,
  onDrillUp: _onDrillUp,
  drillActive,
  onDrillFirstRod,
  stationFt = 0,
}: Props) {
  void _onDrillDown
  void _onDrillUp
  const hour = angleDegToHour(clockAngleDeg)
  const piloting = phase === 'pilot'
  const briefing = phase === 'brief'
  const pushing = pendingPushFt > 0.05
  const onFirstRod = rodIndex <= 1
  const intoRod = ((stationFt % ROD_LENGTH_FT) + ROD_LENGTH_FT) % ROD_LENGTH_FT
  const rodRemainingFt = Math.max(
    0.5,
    Math.round((ROD_LENGTH_FT - intoRod) * 10) / 10 || ROD_LENGTH_FT,
  )
  const isFullRod = pushLengthFt >= ROD_LENGTH_FT - 0.05
  const pushLabel = isFullRod
    ? `Push full 10 ft rod @ ${hour} o'clock`
    : `Push ${pushLengthFt} ft @ ${hour} o'clock`
  const drillLabel = isFullRod
    ? `Drill full 10 ft rod`
    : `Drill ${pushLengthFt} ft straight`


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
            {drillActive
              ? onFirstRod
                ? `drilling first rod… ${pendingPushFt.toFixed(1)} ft left`
                : `drilling… ${pendingPushFt.toFixed(1)} ft left`
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
        <div className="rod-push-len" role="group" aria-label="Rod step (10 ft rod)">
          <span className="rod-push-len-label">Rod step (10 ft rod)</span>
          {PUSH_OPTIONS.map((ft) => (
            <button
              key={ft}
              type="button"
              className={
                !isFullRod && pushLengthFt === ft ? 'rod-chip rod-chip-on' : 'rod-chip'
              }
              onClick={() => onPushLengthFt(ft)}
              disabled={false}
            >
              {ft} ft
            </button>
          ))}
          <button
            type="button"
            className={isFullRod ? 'rod-chip rod-chip-on' : 'rod-chip'}
            onClick={() => onPushLengthFt(ROD_LENGTH_FT)}
            disabled={false}
            title={`Finish this 10 ft rod (~${rodRemainingFt} ft left)`}
          >
            Full rod
          </button>
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
              onClick={() => onDrillStep()}
              title={
                piloting
                  ? `${drillLabel} — one step, then stops (10 ft rod)`
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
          : `Each ${ROD_LENGTH_FT} ft rod: Drill N ft straight or Push ${DEFAULT_PUSH_FT} ft @ clock. Clock optional on rod 1; both options always available in pilot.`}
      </p>
    </section>
  )
}

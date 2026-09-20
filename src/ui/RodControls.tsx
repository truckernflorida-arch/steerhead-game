/**
 * Rod / push marker + deliberate push + Just drill (straight).
 * Rod 1 = just drill (no clock push). Clock/push unlocks on Rod 2+.
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
  /** Discrete steered push at current clock (Rod 2+) */
  onPushStep: () => void
  /** Hold: straight drill (no clock steer) — Rod 2+ */
  onDrillDown: () => void
  onDrillUp: () => void
  drillActive: boolean
  /** Click: continue / shove remaining first rod (straight) */
  onDrillFirstRod?: () => void
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
}: Props) {
  const hour = angleDegToHour(clockAngleDeg)
  const piloting = phase === 'pilot'
  const pushing = pendingPushFt > 0.05
  const firstRod = rodIndex <= 1
  const steerUnlocked = rodIndex >= 2
  const pushLabel = `Push ${pushLengthFt} ft @ ${hour} o'clock`

  return (
    <section className="rod-controls" aria-label="Rod and push controls">
      <div className="rod-marker" role="status">
        <span className="rod-marker-main">
          Rod {rodIndex} of {rodTotal} · {ROD_LENGTH_FT} ft rod
          {steerUnlocked
            ? ` · push ${pushLengthFt} ft @ ${hour} o'clock`
            : ' · first rod — drill (clock optional)'}
        </span>
        {pushing ? (
          <span className="rod-marker-pending">
            {firstRod
              ? `drilling first rod… ${pendingPushFt.toFixed(1)} ft left`
              : `pushing… ${pendingPushFt.toFixed(1)} ft left`}
          </span>
        ) : null}
        {drillActive && steerUnlocked ? (
          <span className="rod-marker-drill">Just drill — straight / level</span>
        ) : null}
        {firstRod && piloting && !pushing ? (
          <span className="rod-marker-drill">
            Spin &amp; shove first {ROD_LENGTH_FT} ft — no clock yet
          </span>
        ) : null}
        {steerUnlocked && piloting ? (
          <span className="rod-marker-drill">
            Now you can push / set clock
          </span>
        ) : null}
      </div>

      {steerUnlocked ? (
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
              disabled={phase === 'debrief'}
            >
              {ft} ft
            </button>
          ))}
        </div>
      ) : null}

      <div className="rod-actions">
        {firstRod ? (
          <button
            type="button"
            className={
              pushing
                ? 'rod-btn rod-btn-drill rod-btn-drill-on'
                : 'rod-btn rod-btn-drill'
            }
            onClick={() => onDrillFirstRod?.()}
            disabled={phase === 'debrief' || pushing}
            title={
              piloting
                ? `Shove remaining first ${ROD_LENGTH_FT} ft straight (no clock required)`
                : 'Set rig pitch, then Drill — clock is optional'
            }
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
                  : 'Drill first rod in first'
              }
            >
              {pushLabel}
            </button>
            <button
              type="button"
              className={
                drillActive
                  ? 'rod-btn rod-btn-drill rod-btn-drill-on'
                  : 'rod-btn rod-btn-drill'
              }
              disabled={!piloting || pushing}
              onPointerDown={(e) => {
                e.preventDefault()
                onDrillDown()
              }}
              onPointerUp={onDrillUp}
              onPointerLeave={onDrillUp}
              onPointerCancel={onDrillUp}
              title={
                piloting
                  ? 'Hold: straight / level drill (no steer)'
                  : 'Drill first rod in first'
              }
            >
              Just drill (level / straight)
            </button>
          </>
        )}
      </div>
      <p className="rod-hint">
        {firstRod
          ? `Rod 1: Drill to spin & shove the first ${ROD_LENGTH_FT} ft along entry pitch — clock is optional. Steered push unlocks on Rod 2+.`
          : `Each ${ROD_LENGTH_FT} ft rod: choose dive / level / steer via clock + optional ${DEFAULT_PUSH_FT} ft pushes. Target steering on Falcon shows pitch band vs plan. Continuous thrust via slider / W.`}
      </p>
    </section>
  )
}

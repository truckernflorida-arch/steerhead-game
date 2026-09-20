/**
 * Rod / push marker + deliberate push + Just drill (straight).
 * Plan-first: push/drill disabled until Spud (pilot phase).
 */
import { angleDegToHour } from '#/game/input/clock'
import { DEFAULT_PUSH_FT, ROD_LENGTH_FT } from '#/game/state'

type Props = {
  clockAngleDeg: number
  pushLengthFt: number
  onPushLengthFt: (ft: number) => void
  pendingPushFt: number
  phase: string
  /** Discrete steered push at current clock */
  onPushStep: () => void
  /** Hold: straight drill (no clock steer) */
  onDrillDown: () => void
  onDrillUp: () => void
  drillActive: boolean
}

const PUSH_OPTIONS = [1, 2, 3] as const

export function RodControls({
  clockAngleDeg,
  pushLengthFt,
  onPushLengthFt,
  pendingPushFt,
  phase,
  onPushStep,
  onDrillDown,
  onDrillUp,
  drillActive,
}: Props) {
  const hour = angleDegToHour(clockAngleDeg)
  const piloting = phase === 'pilot'
  const pushing = pendingPushFt > 0.05
  const pushLabel = `Push ${pushLengthFt} ft @ ${hour} o'clock`

  return (
    <section className="rod-controls" aria-label="Rod and push controls">
      <div className="rod-marker" role="status">
        <span className="rod-marker-main">
          {ROD_LENGTH_FT} ft rod · push {pushLengthFt} ft @ {hour} o&apos;clock
        </span>
        {pushing ? (
          <span className="rod-marker-pending">
            pushing… {pendingPushFt.toFixed(1)} ft left
          </span>
        ) : null}
        {drillActive ? (
          <span className="rod-marker-drill">Just drill — straight</span>
        ) : null}
      </div>

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

      <div className="rod-actions">
        <button
          type="button"
          className="rod-btn rod-btn-push"
          onClick={onPushStep}
          disabled={!piloting || pushing || drillActive}
          title={
            piloting
              ? `Advance ${pushLengthFt} ft at current clock face`
              : 'Spud in first'
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
              ? 'Hold: straight drill (no steer / clock at 12 feel)'
              : 'Spud in first'
          }
        >
          Just drill (straight)
        </button>
      </div>
      <p className="rod-hint">
        Steered push uses the clock face. Just drill holds straight (spin &amp;
        shove) — continuous thrust also via slider / W. Default push{' '}
        {DEFAULT_PUSH_FT} ft.
      </p>
    </section>
  )
}

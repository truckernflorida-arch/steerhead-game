/**
 * Clock-face rod rotation — drag + keyboard hour display.
 * Concept: concepts/01-locator-clock-hud.png · 02-first-rod-clock.png
 */
import { useCallback, useRef } from 'react'
import { angleDegToHour, pointerToClockAngle } from '#/game/input/clock'

type Props = {
  angleDeg: number
  onAngleDeg: (deg: number) => void
  disabled?: boolean
  /** Why the clock is locked (e.g. first rod) */
  lockedHint?: string
}

export function ClockFace({
  angleDeg,
  onAngleDeg,
  disabled,
  lockedHint,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const hour = angleDegToHour(angleDeg)

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = svgRef.current
      if (!el || disabled) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      onAngleDeg(pointerToClockAngle(clientX, clientY, cx, cy))
    },
    [disabled, onAngleDeg],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    dragging.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setFromPointer(e.clientX, e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setFromPointer(e.clientX, e.clientY)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  const handAngle = ((angleDeg - 90) * Math.PI) / 180
  const hx = 100 + Math.cos(handAngle) * 62
  const hy = 100 + Math.sin(handAngle) * 62

  return (
    <div className="clock-face-wrap" aria-label="Rod rotation clock">
      <svg
        ref={svgRef}
        className="clock-face"
        viewBox="0 0 200 200"
        width="180"
        height="180"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(angleDeg)}
        aria-valuetext={`${hour} o'clock`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') {
            e.preventDefault()
            onAngleDeg((angleDeg - 15 + 360) % 360)
          }
          if (e.key === 'ArrowRight' || e.key === 'e' || e.key === 'E') {
            e.preventDefault()
            onAngleDeg((angleDeg + 15) % 360)
          }
        }}
      >
        <circle cx="100" cy="100" r="90" className="clock-ring" />
        <circle cx="100" cy="100" r="78" className="clock-dial" />
        {[12, 3, 6, 9].map((n) => {
          const a = ((n % 12) * 30 - 90) * (Math.PI / 180)
          const tx = 100 + Math.cos(a) * 58
          const ty = 100 + Math.sin(a) * 58
          return (
            <text
              key={n}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              className="clock-num"
            >
              {n}
            </text>
          )
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180)
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 70}
              y1={100 + Math.sin(a) * 70}
              x2={100 + Math.cos(a) * 78}
              y2={100 + Math.sin(a) * 78}
              className="clock-tick"
            />
          )
        })}
        <line
          x1="100"
          y1="100"
          x2={hx}
          y2={hy}
          className="clock-hand"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" className="clock-hub" />
      </svg>
      <p className="clock-caption">
        {disabled && lockedHint
          ? lockedHint
          : 'ROTATE TO SET STEER'}{' '}
        · <strong>{hour} O&apos;CLOCK</strong>
      </p>
      <p className="clock-hint">
        {disabled && lockedHint
          ? 'Clock / push unlock after first rod (~10 ft)'
          : 'Drag · Q/E nudge · 1–9,0 hours · A/D augment'}
      </p>
    </div>
  )
}

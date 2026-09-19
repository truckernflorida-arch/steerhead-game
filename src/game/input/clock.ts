/**
 * Clock-face rod rotation → steer.
 * 12 = climb, 6 = dive, 3/9 = hold (2D profile).
 * Angle: 0° at 12, clockwise.
 */
import type { InputFrame } from './index'

export const CLOCK_HOURS = 12

export function hourToAngleDeg(hour: number): number {
  const h = ((hour % 12) + 12) % 12
  return h * 30
}

export function angleDegToHour(angleDeg: number): number {
  const a = ((angleDeg % 360) + 360) % 360
  const hour = Math.round(a / 30) % 12
  return hour === 0 ? 12 : hour
}

/** -cos: 12→climb(-1), 3→0, 6→dive(+1), 9→0 */
export function clockAngleToSteer(angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180
  return -Math.cos(rad)
}

export function normalizeAngleDeg(angleDeg: number): number {
  let a = angleDeg % 360
  if (a < 0) a += 360
  return a
}

export function pointerToClockAngle(
  clientX: number,
  clientY: number,
  centerX: number,
  centerY: number,
): number {
  const dx = clientX - centerX
  const dy = clientY - centerY
  const rad = Math.atan2(dx, -dy)
  return normalizeAngleDeg((rad * 180) / Math.PI)
}

export type ClockControl = {
  angleDeg: number
  setAngleDeg: (deg: number) => void
  setHour: (hour: number) => void
  nudge: (deltaDeg: number) => void
}

export function createClockControl(initialDeg = 180): ClockControl {
  let angleDeg = normalizeAngleDeg(initialDeg)
  return {
    get angleDeg() {
      return angleDeg
    },
    setAngleDeg(deg: number) {
      angleDeg = normalizeAngleDeg(deg)
    },
    setHour(hour: number) {
      angleDeg = hourToAngleDeg(hour)
    },
    nudge(deltaDeg: number) {
      angleDeg = normalizeAngleDeg(angleDeg + deltaDeg)
    },
  }
}

/** Blend clock face + keyboard A/D nudge into steer. */
export function sampleClock(
  frame: InputFrame,
  angleDeg: number,
  keyboardSteer = 0,
): InputFrame {
  const fromClock = clockAngleToSteer(angleDeg)
  const steer = Math.max(-1, Math.min(1, fromClock + keyboardSteer * 0.35))
  return {
    ...frame,
    steer,
    clockAngleDeg: normalizeAngleDeg(angleDeg),
  }
}

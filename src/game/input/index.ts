/**
 * InputFrame aggregate — keyboard + touch + clock-face rod rotation.
 */
export type InputFrame = {
  /** Steer / pitch -1..1 (dive +) */
  steer: number
  /** Thrust / push 0..1 */
  thrust: number
  rpm: number
  touchSpeed: number
  /** Clock-face angle deg from 12 o'clock, clockwise */
  clockAngleDeg: number
  keys: Record<string, boolean>
  startPush?: boolean
  retry?: boolean
}

export function createEmptyInput(): InputFrame {
  return {
    steer: 0,
    thrust: 0,
    rpm: 0,
    touchSpeed: 0,
    clockAngleDeg: 180,
    keys: {},
  }
}

export { sampleKeyboard } from './keyboard'
export { sampleTouchSpeed, createTouchSpeedControl, type TouchSpeedControl } from './touch'
export {
  sampleClock,
  createClockControl,
  hourToAngleDeg,
  angleDegToHour,
  clockAngleToSteer,
  pointerToClockAngle,
  normalizeAngleDeg,
  type ClockControl,
} from './clock'

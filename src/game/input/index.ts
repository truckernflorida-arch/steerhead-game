/**
 * InputFrame aggregate — keyboard + touch + clock-face rod rotation.
 * Discrete rod push + just-drill (straight) are first-class.
 * Rig entry pitch set in brief before Spud.
 */
export type InputFrame = {
  /** Steer / pitch -1..1 (HDD: climb +, dive −) */
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
  /** Edge: consume one discrete push of pushLengthFt at current clock */
  pushStep?: boolean
  /** Edge: discrete straight drill of pushLengthFt (no clock steer) — tap-friendly */
  drillStep?: boolean
  /** Hold: continuous straight drill — no clock steer */
  drillStraight?: boolean
  /** Rod push step length (ft); default 2 */
  pushLengthFt?: number
  /** Rig / bit entry pitch (°; HDD − dive / + climb) — brief setup */
  entryPitchDeg?: number
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
  clockAngleToYaw,
  pointerToClockAngle,
  normalizeAngleDeg,
  type ClockControl,
} from './clock'

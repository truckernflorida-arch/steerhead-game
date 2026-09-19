/**
 * InputFrame aggregate — keyboard + touch stubs.
 */
export type InputFrame = {
  /** Steer left/right -1..1 */
  steer: number
  /** Thrust / push 0..1 */
  thrust: number
  /** RPM hold / spin 0..1 */
  rpm: number
  /** Touch speed-control stub (mobile) — placeholder API */
  touchSpeed: number
  keys: Record<string, boolean>
}

export function createEmptyInput(): InputFrame {
  return {
    steer: 0,
    thrust: 0,
    rpm: 0,
    touchSpeed: 0,
    keys: {},
  }
}

export { sampleKeyboard } from './keyboard'
export { sampleTouchSpeed, type TouchSpeedControl } from './touch'

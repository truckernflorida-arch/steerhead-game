/**
 * Mobile-friendly touch speed-control stub (placeholder API).
 * UI may bind a slider / drag strip → setSpeed(0..1); game loop reads sampleTouchSpeed.
 * TODO: real gesture mapping when mobile playtest starts.
 */
export type TouchSpeedControl = {
  /** Normalized speed 0..1 */
  speed: number
  setSpeed: (v: number) => void
  /** Optional: pointer/touch active */
  active: boolean
}

export function createTouchSpeedControl(initial = 0): TouchSpeedControl {
  let speed = Math.min(1, Math.max(0, initial))
  let active = false
  return {
    get speed() {
      return speed
    },
    get active() {
      return active
    },
    setSpeed(v: number) {
      speed = Math.min(1, Math.max(0, v))
      active = true
    },
  }
}

export function sampleTouchSpeed(
  control: TouchSpeedControl,
): Pick<import('./index').InputFrame, 'touchSpeed' | 'thrust'> {
  return {
    touchSpeed: control.speed,
    // Mirror into thrust for now — placeholder until Bot controls land
    thrust: control.speed,
  }
}

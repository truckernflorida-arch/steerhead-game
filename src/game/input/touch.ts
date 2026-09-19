/**
 * Mobile-friendly touch speed-control stub.
 * UI binds slider → setSpeed(0..1); loop reads sampleTouchSpeed.
 */
export type TouchSpeedControl = {
  speed: number
  setSpeed: (v: number) => void
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
    thrust: control.speed,
  }
}

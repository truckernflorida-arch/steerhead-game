/**
 * Keyboard → InputFrame.
 * WASD/arrows: thrust + steer nudge (blended with clock in sampleClock).
 * Hour snaps / Q-E are edge-handled in play.tsx.
 */
import type { InputFrame } from './index'

export function sampleKeyboard(
  frame: InputFrame,
  keys: ReadonlySet<string> | Readonly<Record<string, boolean>>,
): InputFrame {
  const down = (k: string): boolean => {
    if (keys instanceof Set) return keys.has(k)
    return Boolean((keys as Readonly<Record<string, boolean>>)[k])
  }

  let keyboardSteer = 0
  if (down('ArrowLeft') || down('a') || down('A')) keyboardSteer -= 1
  if (down('ArrowRight') || down('d') || down('D')) keyboardSteer += 1

  let thrust = frame.thrust
  if (down('ArrowUp') || down('w') || down('W')) thrust = 1
  if (down('ArrowDown') || down('s') || down('S')) thrust = 0

  return {
    ...frame,
    steer: keyboardSteer,
    thrust,
    keys: { ...frame.keys },
  }
}

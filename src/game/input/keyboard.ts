/**
 * Keyboard input stub.
 * TODO: map WASD / arrows to InputFrame once controls lock.
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

  let steer = 0
  if (down('ArrowLeft') || down('a') || down('A')) steer -= 1
  if (down('ArrowRight') || down('d') || down('D')) steer += 1
  let thrust = frame.thrust
  if (down('ArrowUp') || down('w') || down('W')) thrust = 1
  if (down('ArrowDown') || down('s') || down('S')) thrust = 0

  return { ...frame, steer, thrust, keys: { ...frame.keys } }
}

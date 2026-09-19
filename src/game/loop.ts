/**
 * Game loop stub — rAF: sample input → update → collide → score → render.
 * TODO: wire real loop once physics (Bot 2) + TickSnap emitter are live.
 */
import type { GameState } from './state'
import type { InputFrame } from './input'
import { createEmptyInput } from './input'
import { update } from './update'
import { render } from './render'

export type LoopHandles = {
  start: () => void
  stop: () => void
  /** Latest input sample (mutated by input stubs) */
  input: InputFrame
}

export function createLoop(
  getState: () => GameState,
  setState: (next: GameState) => void,
  canvas: HTMLCanvasElement | null,
): LoopHandles {
  let raf = 0
  let last = 0
  const input = createEmptyInput()

  function tick(now: number) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
    last = now
    const next = update(getState(), input, dt)
    setState(next)
    if (canvas) render(canvas, next)
    raf = requestAnimationFrame(tick)
  }

  return {
    input,
    start: () => {
      last = 0
      raf = requestAnimationFrame(tick)
    },
    stop: () => {
      cancelAnimationFrame(raf)
      raf = 0
    },
  }
}

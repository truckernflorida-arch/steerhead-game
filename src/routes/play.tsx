/**
 * Play route — Lesson 1 = S01 Dirt Yard with SOIL_FOUR dirt / light_fill feel.
 */
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createPhysicsEmitter,
  emitFromGameState,
  type TickSnap,
  type VerbId,
} from '#/game/ticksnap'
import { loadLesson1 } from '#/game/levels'
import { getLesson1Soil, LESSON1_SOIL_ID } from '#/game/env/soil'
import { createTouchSpeedControl, sampleTouchSpeed } from '#/game/input/touch'
import { sampleKeyboard, createEmptyInput } from '#/game/input'
import { createGameState, type GameState } from '#/game/state'
import { update } from '#/game/update'
import { render } from '#/game/render'
import { TrainerHud } from '#/ui/TrainerHud'

export const Route = createFileRoute('/play')({ component: PlayPage })

function PlayPage() {
  const level = useMemo(() => loadLesson1(), [])
  const soil = useMemo(() => getLesson1Soil(), [])
  const emitter = useRef(createPhysicsEmitter())
  const touch = useRef(createTouchSpeedControl(0.35))
  const keysRef = useRef<Record<string, boolean>>({})
  const stateRef = useRef<GameState>(createGameState(level))
  const [snap, setSnap] = useState<TickSnap>(() =>
    emitFromGameState(emitter.current, stateRef.current),
  )
  const [detailOpen, setDetailOpen] = useState(false)
  const [touchSpeed, setTouchSpeed] = useState(0.35)
  const [status, setStatus] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    stateRef.current = createGameState(level)
    emitter.current = createPhysicsEmitter()
  }, [level])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true
    }
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now

      let input = createEmptyInput()
      input = sampleKeyboard(input, keysRef.current)
      const touchSample = sampleTouchSpeed(touch.current)
      input = {
        ...input,
        touchSpeed: touchSample.touchSpeed,
        thrust: Math.max(input.thrust, touchSample.thrust),
        keys: { ...keysRef.current },
      }

      const next = update(stateRef.current, input, dt)
      stateRef.current = next
      const nextSnap = emitFromGameState(emitter.current, next)
      setSnap(nextSnap)
      setStatus(
        `depth ${next.headDepth_m.toFixed(2)} m · pitch ${next.pitchDeg.toFixed(2)}° · ROP ${next.rop_m_s.toFixed(3)} m/s`,
      )

      const c = canvasRef.current
      if (c) render(c, next)

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function onVerb(id: VerbId) {
    console.info('[verb]', id)
  }

  return (
    <main className="play-shell">
      <header className="play-header">
        <h1>{level.bibleTitle}</h1>
        <p className="play-sub">
          Lesson 1 · id <code>{level.id}</code> · soil{' '}
          <code>
            {LESSON1_SOIL_ID}→{soil.fourPack}
          </code>{' '}
          · {level.bore?.length_ft ?? 120} ft · plantFail{' '}
          <code>{level.plantFail}</code>
          {level.mud.locked ? ' · mud locked' : ''} · ROP{' '}
          {soil.ropRange_m_s[0]}–{soil.ropRange_m_s[1]} m/s · maxSteer{' '}
          {soil.maxSteerDegPerM}°/m
        </p>
        {status ? <p className="play-sub">{status}</p> : null}
      </header>

      <div className="play-layout">
        <canvas
          ref={canvasRef}
          className="play-canvas"
          width={640}
          height={360}
          aria-label="Bore view — dirt feel"
        />
        <TrainerHud
          snap={snap}
          causeLog={emitter.current.log}
          onVerb={onVerb}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((v) => !v)}
        />
      </div>

      <div className="touch-speed" aria-label="Touch speed control">
        <label htmlFor="touch-speed">
          Touch speed / thrust <span>{touchSpeed.toFixed(2)}</span>
        </label>
        <input
          id="touch-speed"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={touchSpeed}
          onChange={(e) => {
            const v = Number(e.target.value)
            touch.current.setSpeed(v)
            setTouchSpeed(v)
          }}
        />
      </div>
    </main>
  )
}

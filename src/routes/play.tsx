/**
 * Play route — Lesson 1 = S01 Dirt Yard (light_fill / dirt).
 * Clock + locator + profile bore + brief→push→daylight/TF_PANIC_DOGLEG debrief.
 * Brief: no blocking overlay; set clock first, then Spud in / Start push.
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
import {
  sampleKeyboard,
  createEmptyInput,
  createClockControl,
  sampleClock,
  normalizeAngleDeg,
} from '#/game/input'
import { createGameState, resetGameState, type GameState } from '#/game/state'
import { update } from '#/game/update'
import { render } from '#/game/render'
import { TrainerHud } from '#/ui/TrainerHud'
import { ClockFace } from '#/ui/ClockFace'
import { LocatorPanel } from '#/ui/LocatorPanel'
import { FlowOverlay } from '#/ui/FlowOverlay'

export const Route = createFileRoute('/play')({ component: PlayPage })

const INITIAL_CLOCK_DEG = 180

function PlayPage() {
  const level = useMemo(() => loadLesson1(), [])
  const soil = useMemo(() => getLesson1Soil(), [])
  const emitter = useRef(createPhysicsEmitter())
  const touch = useRef(createTouchSpeedControl(0))
  const clock = useRef(createClockControl(INITIAL_CLOCK_DEG))
  const keysRef = useRef<Record<string, boolean>>({})
  const prevKeysRef = useRef<Record<string, boolean>>({})
  const startPushRef = useRef(false)
  const retryRef = useRef(false)
  const clockConfirmedRef = useRef(false)
  const stateRef = useRef<GameState>(createGameState(level))
  const [snap, setSnap] = useState<TickSnap>(() =>
    emitFromGameState(emitter.current, stateRef.current),
  )
  const [detailOpen, setDetailOpen] = useState(false)
  const [touchSpeed, setTouchSpeed] = useState(0)
  const [clockAngle, setClockAngle] = useState(INITIAL_CLOCK_DEG)
  const [clockConfirmed, setClockConfirmed] = useState(false)
  const [status, setStatus] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    stateRef.current = createGameState(level)
    emitter.current = createPhysicsEmitter()
    clock.current.setAngleDeg(INITIAL_CLOCK_DEG)
    setClockAngle(INITIAL_CLOCK_DEG)
    clockConfirmedRef.current = false
    setClockConfirmed(false)
    touch.current.setSpeed(0)
    setTouchSpeed(0)
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

      const keys = keysRef.current
      const prev = prevKeysRef.current
      const edge = (k: string) => keys[k] && !prev[k]

      const phase = stateRef.current.phase
      const clockBefore = clock.current.angleDeg

      // Hour snaps + Q/E nudge (edge) — allowed in brief so player can set clock
      if (edge('q') || edge('Q')) clock.current.nudge(-15)
      if (edge('e') || edge('E')) clock.current.nudge(15)
      for (let h = 1; h <= 9; h++) {
        if (edge(String(h))) clock.current.setHour(h)
      }
      if (edge('0')) clock.current.setHour(10)
      if (edge('-') || edge('_')) clock.current.setHour(11)
      if (edge('=') || edge('+')) clock.current.setHour(12)

      if (
        phase === 'brief' &&
        !clockConfirmedRef.current &&
        clock.current.angleDeg !== clockBefore
      ) {
        clockConfirmedRef.current = true
        setClockConfirmed(true)
      }

      let input = createEmptyInput()
      // During brief: do not sample W thrust / steer into motion — clock only.
      // update() already freezes station/depth in brief; strip thrust so W cannot
      // look like a start and touch pre-set stays inert until Spud in.
      if (phase === 'brief') {
        input = sampleClock(input, clock.current.angleDeg, 0)
        input = {
          ...input,
          thrust: 0,
          touchSpeed: 0,
          keys: { ...keys },
          startPush: startPushRef.current,
          retry: retryRef.current,
        }
      } else {
        input = sampleKeyboard(input, keys)
        const kbSteer = input.steer
        input = sampleClock(input, clock.current.angleDeg, kbSteer)
        const touchSample = sampleTouchSpeed(touch.current)
        input = {
          ...input,
          touchSpeed: touchSample.touchSpeed,
          thrust: Math.max(input.thrust, touchSample.thrust),
          keys: { ...keys },
          startPush: startPushRef.current,
          retry: retryRef.current,
        }
      }
      startPushRef.current = false
      retryRef.current = false
      prevKeysRef.current = { ...keys }

      const next = update(stateRef.current, input, dt)
      stateRef.current = next
      setClockAngle(next.clockAngleDeg)
      clock.current.setAngleDeg(next.clockAngleDeg)
      const nextSnap = emitFromGameState(emitter.current, next)
      setSnap(nextSnap)
      setStatus(
        `sta ${next.station_ft.toFixed(0)} ft · depth ${next.coverDepth_ft.toFixed(1)} ft · pitch ${next.pitchDeg.toFixed(1)}° · ROP ${next.rop_m_s.toFixed(3)} m/s`,
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

  function onClockAngle(deg: number) {
    const a = normalizeAngleDeg(deg)
    clock.current.setAngleDeg(a)
    setClockAngle(a)
    if (!clockConfirmedRef.current) {
      clockConfirmedRef.current = true
      setClockConfirmed(true)
    }
  }

  function onStartPush() {
    if (stateRef.current.phase !== 'brief') return
    startPushRef.current = true
  }

  function onRetry() {
    retryRef.current = true
    stateRef.current = resetGameState(stateRef.current)
    emitter.current = createPhysicsEmitter()
    clock.current.setAngleDeg(INITIAL_CLOCK_DEG)
    setClockAngle(INITIAL_CLOCK_DEG)
    clockConfirmedRef.current = false
    setClockConfirmed(false)
    touch.current.setSpeed(0)
    setTouchSpeed(0)
  }

  const pushing = snap.phase === 'pilot'
  const inBrief = snap.phase === 'brief'

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

      <div className="play-top">
        <LocatorPanel snap={snap} />
        <div className="clock-stack">
          <ClockFace
            angleDeg={clockAngle}
            onAngleDeg={onClockAngle}
            disabled={snap.phase === 'debrief'}
          />
          {inBrief ? (
            <div className="spud-row">
              <p className="spud-hint">
                {clockConfirmed
                  ? 'Clock set — ready to spud in.'
                  : 'Set clock face first (drag or 1–12), then start push.'}
              </p>
              <button
                type="button"
                className="flow-primary spud-btn"
                onClick={onStartPush}
                disabled={!clockConfirmed}
              >
                Spud in / Start push
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <FlowOverlay snap={snap} level={level} onRetry={onRetry} />

      <div className="play-layout">
        <canvas
          ref={canvasRef}
          className="play-canvas"
          width={720}
          height={400}
          aria-label="Profile bore view — entry to daylight"
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
          disabled={!pushing}
          onChange={(e) => {
            const v = Number(e.target.value)
            touch.current.setSpeed(v)
            setTouchSpeed(v)
          }}
        />
        {inBrief ? (
          <p className="touch-speed-note">
            Thrust stays at 0 until you Spud in — slider unlocks after start.
          </p>
        ) : null}
      </div>

    </main>
  )
}

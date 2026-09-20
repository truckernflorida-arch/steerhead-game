/**
 * Play route — Lesson 1 = S01 Dirt Yard (light_fill / dirt).
 * Crew workflow: rig entry pitch → Spud → 10 ft rods along curved ROW.
 * Target steering on Falcon/locator · Ground locate map with APWA paint.
 * Brief: set clock + rig pitch first; no auto-run.
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
import {
  createGameState,
  resetGameState,
  DEFAULT_PUSH_FT,
  DEFAULT_ENTRY_PITCH_DEG,
  ENTRY_PITCH_MIN,
  ENTRY_PITCH_MAX,
  type GameState,
} from '#/game/state'
import { update } from '#/game/update'
import { render } from '#/game/render'
import { renderOblique } from '#/game/renderOblique'
import { renderGround } from '#/game/renderGround'
import { TrainerHud } from '#/ui/TrainerHud'
import { ClockFace } from '#/ui/ClockFace'
import { LocatorPanel } from '#/ui/LocatorPanel'
import { FlowOverlay } from '#/ui/FlowOverlay'
import { RodControls } from '#/ui/RodControls'
import { FalconRemote } from '#/ui/FalconRemote'

export const Route = createFileRoute('/play')({ component: PlayPage })

const INITIAL_CLOCK_DEG = 180

type MapView = 'profile' | 'oblique' | 'ground'

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
  const pushStepRef = useRef(false)
  const drillStraightRef = useRef(false)
  const pushLengthRef = useRef(DEFAULT_PUSH_FT)
  const entryPitchRef = useRef(DEFAULT_ENTRY_PITCH_DEG)
  const clockConfirmedRef = useRef(false)
  const stateRef = useRef<GameState>(createGameState(level))
  const [snap, setSnap] = useState<TickSnap>(() =>
    emitFromGameState(emitter.current, stateRef.current),
  )
  const [detailOpen, setDetailOpen] = useState(false)
  const [touchSpeed, setTouchSpeed] = useState(0)
  const [clockAngle, setClockAngle] = useState(INITIAL_CLOCK_DEG)
  const [clockConfirmed, setClockConfirmed] = useState(false)
  const [pushLengthFt, setPushLengthFt] = useState(DEFAULT_PUSH_FT)
  const [entryPitchDeg, setEntryPitchDeg] = useState(DEFAULT_ENTRY_PITCH_DEG)
  const [pendingPushFt, setPendingPushFt] = useState(0)
  const [drillActive, setDrillActive] = useState(false)
  const [rodIndex, setRodIndex] = useState(1)
  const [rodTotal, setRodTotal] = useState(12)
  const [mapView, setMapView] = useState<MapView>('profile')
  const [status, setStatus] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const obliqueRef = useRef<HTMLCanvasElement>(null)
  const groundRef = useRef<HTMLCanvasElement>(null)
  const mapViewRef = useRef<MapView>('profile')

  useEffect(() => {
    stateRef.current = createGameState(level)
    emitter.current = createPhysicsEmitter()
    clock.current.setAngleDeg(INITIAL_CLOCK_DEG)
    setClockAngle(INITIAL_CLOCK_DEG)
    clockConfirmedRef.current = false
    setClockConfirmed(false)
    touch.current.setSpeed(0)
    setTouchSpeed(0)
    pushLengthRef.current = DEFAULT_PUSH_FT
    setPushLengthFt(DEFAULT_PUSH_FT)
    entryPitchRef.current = DEFAULT_ENTRY_PITCH_DEG
    setEntryPitchDeg(DEFAULT_ENTRY_PITCH_DEG)
    drillStraightRef.current = false
    setDrillActive(false)
    setRodIndex(1)
    setRodTotal(stateRef.current.rodTotal)
  }, [level])

  useEffect(() => {
    mapViewRef.current = mapView
  }, [mapView])

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

      if (edge('q') || edge('Q')) clock.current.nudge(-15)
      if (edge('e') || edge('E')) clock.current.nudge(15)
      for (let h = 1; h <= 9; h++) {
        if (edge(String(h))) clock.current.setHour(h)
      }
      if (edge('0')) clock.current.setHour(10)
      if (edge('-') || edge('_')) clock.current.setHour(11)
      if (edge('=') || edge('+')) clock.current.setHour(12)

      // Brief: nudge entry pitch with [ / ]
      if (phase === 'brief') {
        if (edge('[')) {
          entryPitchRef.current = Math.max(
            ENTRY_PITCH_MIN,
            entryPitchRef.current - 0.5,
          )
          setEntryPitchDeg(entryPitchRef.current)
        }
        if (edge(']')) {
          entryPitchRef.current = Math.min(
            ENTRY_PITCH_MAX,
            entryPitchRef.current + 0.5,
          )
          setEntryPitchDeg(entryPitchRef.current)
        }
      }

      if (
        phase === 'brief' &&
        !clockConfirmedRef.current &&
        clock.current.angleDeg !== clockBefore
      ) {
        clockConfirmedRef.current = true
        setClockConfirmed(true)
      }

      let input = createEmptyInput()
      if (phase === 'brief') {
        input = sampleClock(input, clock.current.angleDeg, 0)
        input = {
          ...input,
          thrust: 0,
          touchSpeed: 0,
          keys: { ...keys },
          startPush: startPushRef.current,
          retry: retryRef.current,
          pushStep: false,
          drillStraight: false,
          pushLengthFt: pushLengthRef.current,
          entryPitchDeg: entryPitchRef.current,
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
          pushStep: pushStepRef.current,
          drillStraight: drillStraightRef.current,
          pushLengthFt: pushLengthRef.current,
          entryPitchDeg: entryPitchRef.current,
        }
      }
      startPushRef.current = false
      retryRef.current = false
      pushStepRef.current = false
      prevKeysRef.current = { ...keys }

      const next = update(stateRef.current, input, dt)
      stateRef.current = next
      setClockAngle(next.clockAngleDeg)
      clock.current.setAngleDeg(next.clockAngleDeg)
      setPendingPushFt(next.pendingPush_ft)
      setDrillActive(next.drillStraight)
      setRodIndex(next.rodIndex)
      setRodTotal(next.rodTotal)
      setEntryPitchDeg(next.entryPitchDeg)
      const nextSnap = emitFromGameState(emitter.current, next)
      setSnap(nextSnap)
      setStatus(
        `Rod ${next.rodIndex}/${next.rodTotal} · sta ${next.station_ft.toFixed(0)} ft · depth ${next.coverDepth_ft.toFixed(1)} ft · L/R ${next.lateral_ft >= 0 ? '+' : ''}${next.lateral_ft.toFixed(1)} · pitch ${next.pitchDeg.toFixed(1)}° (tgt ${next.targetPitchDeg.toFixed(1)}°) · ROP ${next.rop_m_s.toFixed(3)} m/s`,
      )

      if (mapViewRef.current === 'profile') {
        const c = canvasRef.current
        if (c) render(c, next)
      } else if (mapViewRef.current === 'oblique') {
        const o = obliqueRef.current
        if (o) renderOblique(o, next)
      } else {
        const g = groundRef.current
        if (g) renderGround(g, next)
      }

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

  function onEntryPitch(v: number) {
    const clamped = Math.min(
      ENTRY_PITCH_MAX,
      Math.max(ENTRY_PITCH_MIN, v),
    )
    entryPitchRef.current = clamped
    setEntryPitchDeg(clamped)
  }

  function onStartPush() {
    if (stateRef.current.phase !== 'brief') return
    startPushRef.current = true
  }

  function onPushStep() {
    if (stateRef.current.phase !== 'pilot') return
    pushStepRef.current = true
  }

  function onDrillDown() {
    if (stateRef.current.phase !== 'pilot') return
    drillStraightRef.current = true
    setDrillActive(true)
  }

  function onDrillUp() {
    drillStraightRef.current = false
    setDrillActive(false)
  }

  function onPushLength(ft: number) {
    pushLengthRef.current = ft
    setPushLengthFt(ft)
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
    pushLengthRef.current = DEFAULT_PUSH_FT
    setPushLengthFt(DEFAULT_PUSH_FT)
    entryPitchRef.current = DEFAULT_ENTRY_PITCH_DEG
    setEntryPitchDeg(DEFAULT_ENTRY_PITCH_DEG)
    setPendingPushFt(0)
    drillStraightRef.current = false
    setDrillActive(false)
    setRodIndex(1)
    setRodTotal(stateRef.current.rodTotal)
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
          · {level.bore?.length_ft ?? 120} ft curved ROW · plantFail{' '}
          <code>{level.plantFail}</code>
          {level.mud.locked ? ' · mud locked' : ''} · ROP{' '}
          {soil.ropRange_m_s[0]}–{soil.ropRange_m_s[1]} m/s · maxSteer{' '}
          {soil.maxSteerDegPerM}°/m
        </p>
        {status ? <p className="play-sub">{status}</p> : null}
      </header>

      <div className="play-top">
        <LocatorPanel snap={snap} />
        <FalconRemote snap={snap} />
        <div className="clock-stack">
          <ClockFace
            angleDeg={clockAngle}
            onAngleDeg={onClockAngle}
            disabled={snap.phase === 'debrief'}
          />
          {inBrief ? (
            <div className="spud-row">
              <div className="rig-pitch" aria-label="Rig entry pitch setup">
                <label htmlFor="rig-pitch">
                  Rig entry pitch{' '}
                  <strong>
                    {entryPitchDeg.toFixed(1)}°
                  </strong>
                </label>
                <div className="rig-pitch-row">
                  <button
                    type="button"
                    className="rod-chip"
                    onClick={() => onEntryPitch(entryPitchDeg - 0.5)}
                    aria-label="Lower entry pitch"
                  >
                    −
                  </button>
                  <input
                    id="rig-pitch"
                    type="range"
                    min={ENTRY_PITCH_MIN}
                    max={ENTRY_PITCH_MAX}
                    step={0.5}
                    value={entryPitchDeg}
                    onChange={(e) => onEntryPitch(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="rod-chip"
                    onClick={() => onEntryPitch(entryPitchDeg + 0.5)}
                    aria-label="Raise entry pitch"
                  >
                    +
                  </button>
                </div>
                <p className="spud-hint rig-pitch-hint">
                  Raise/lower machine (or bit) before Spud. Next rods level out
                  or keep diving per depth plan. Keys [ ]
                </p>
              </div>
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

      <RodControls
        clockAngleDeg={clockAngle}
        pushLengthFt={pushLengthFt}
        onPushLengthFt={onPushLength}
        pendingPushFt={pendingPushFt}
        phase={snap.phase}
        rodIndex={rodIndex}
        rodTotal={rodTotal}
        onPushStep={onPushStep}
        onDrillDown={onDrillDown}
        onDrillUp={onDrillUp}
        drillActive={drillActive}
      />

      <FlowOverlay snap={snap} level={level} onRetry={onRetry} />

      <div className="map-tabs" role="tablist" aria-label="Bore views">
        <button
          type="button"
          role="tab"
          aria-selected={mapView === 'profile'}
          className={mapView === 'profile' ? 'map-tab map-tab-on' : 'map-tab'}
          onClick={() => setMapView('profile')}
        >
          Profile (depth)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mapView === 'oblique'}
          className={mapView === 'oblique' ? 'map-tab map-tab-on' : 'map-tab'}
          onClick={() => setMapView('oblique')}
        >
          Oblique 3D
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mapView === 'ground'}
          className={mapView === 'ground' ? 'map-tab map-tab-on' : 'map-tab'}
          onClick={() => setMapView('ground')}
        >
          Ground locate
        </button>
      </div>

      <div className="play-layout">
        {mapView === 'profile' ? (
          <canvas
            ref={canvasRef}
            className="play-canvas"
            width={720}
            height={400}
            aria-label="Profile bore view — entry to daylight"
          />
        ) : mapView === 'oblique' ? (
          <canvas
            ref={obliqueRef}
            className="play-canvas oblique-canvas"
            width={720}
            height={360}
            aria-label="Oblique 3D map — curved ROW and utilities"
          />
        ) : (
          <canvas
            ref={groundRef}
            className="play-canvas ground-canvas"
            width={720}
            height={400}
            aria-label="Ground locate map — curved road and APWA paint"
          />
        )}
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
          Drill / continuous thrust <span>{touchSpeed.toFixed(2)}</span>
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
            Set rig pitch + clock, then Spud. Thrust stays at 0 until start.
            Prefer Push 2 ft @ clock for deliberate rod steps.
          </p>
        ) : (
          <p className="touch-speed-note">
            Continuous free thrust (Drill). Deliberate 2 ft pushes use the rod
            buttons above. Falcon TARGET STEERING shows pitch band vs plan.
          </p>
        )}
      </div>
    </main>
  )
}

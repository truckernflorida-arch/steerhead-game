/**
 * Build TickSnap from live GameState (Lesson 1 dirt feel).
 * Minimal cascade: TF_PANIC_DOGLEG; secondary only if GPM killed.
 */
import type { GameState } from '../state'
import { getLesson1Soil, LIGHT_FILL_TEACH } from '../env/soil'
import { angleDegToHour } from '../input/clock'
import type { CauseLog, CauseSnap, TickSnap, VerbSnap } from './types'
import { logCauseTransitions } from './causeLog'

const CAUSE_META: Record<string, CauseSnap> = {
  TF_PANIC_DOGLEG: {
    id: 'TF_PANIC_DOGLEG',
    label: 'Panic dogleg — over-steer inventing bend in easy dirt',
    tag: 'steer-death',
  },
  TF_PACKED_HEAD: {
    id: 'TF_PACKED_HEAD',
    label: 'Head packed — GPM starved while pushing',
    tag: 'secondary',
  },
  TF_FRAC_THIN: {
    id: 'TF_FRAC_THIN',
    label: 'Frac thin — hole starved (GPM killed)',
    tag: 'secondary',
  },
}

export type PhysicsEmitterState = {
  causes: CauseSnap[]
  log: CauseLog
}

export function createPhysicsEmitter(): PhysicsEmitterState {
  return { causes: [], log: [] }
}

function verbsFor(causes: CauseSnap[]): VerbSnap[] {
  const ids = new Set(causes.map((c) => c.id))
  const chips: VerbSnap[] = []
  if (ids.has('TF_PANIC_DOGLEG')) {
    chips.push({ id: 'RV_EASE_THRUST', label: 'Ease thrust', enabled: true })
    chips.push({ id: 'RV_HOLD_RPM', label: 'Hold grade / rotate', enabled: true })
  }
  if (ids.has('TF_PACKED_HEAD') || ids.has('TF_FRAC_THIN')) {
    chips.push({
      id: 'RV_CIRCULATE_NO_PUSH',
      label: 'Circulate (no push)',
      enabled: true,
    })
    chips.push({ id: 'RV_EASE_THRUST', label: 'Ease thrust', enabled: true })
  }
  const seen = new Set<string>()
  return chips.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
}

function symptomsFor(
  state: GameState,
  causes: CauseSnap[],
): TickSnap['symptoms'] {
  const s: TickSnap['symptoms'] = []
  if (state.panicDoglegWarn && !state.taughtFail) {
    s.push({ id: 'oversteer', label: 'OVER-STEER', severity: 'warn' })
  }
  for (const c of causes) {
    if (c.id === 'TF_PANIC_DOGLEG') {
      s.push({ id: 'panic_dogleg', label: 'PANIC DOGLEG', severity: 'critical' })
    }
    if (c.id === 'TF_PACKED_HEAD') {
      s.push({ id: 'packed', label: 'HEAD PACKED', severity: 'critical' })
    }
    if (c.id === 'TF_FRAC_THIN') {
      s.push({ id: 'frac', label: 'FRAC RISK', severity: 'critical' })
    }
  }
  if (state.gpmNorm < 0.3) {
    s.push({ id: 'gpm_low', label: 'GPM LOW', severity: 'warn' })
  }
  if (state.outcome === 'daylight') {
    s.push({ id: 'daylight', label: 'DAYLIGHT', severity: 'info' })
  }
  if (state.outcome === 'wrong_daylight') {
    s.push({ id: 'wrong_daylight', label: 'OFF-GRADE EXIT', severity: 'warn' })
  }
  return s
}

function debriefFor(state: GameState): TickSnap['debrief'] | undefined {
  if (state.phase !== 'debrief') return undefined
  if (state.taughtFail && CAUSE_META[state.taughtFail]) {
    const cause = CAUSE_META[state.taughtFail]
    return {
      headline: cause.label,
      body:
        state.level?.failSentence ??
        'In easy ground with good mud, the bore dies from how you steer — not from the dirt.',
      ticketScore: state.ticketScore,
    }
  }
  if (state.outcome === 'daylight') {
    return {
      headline: 'Daylight — clean pass',
      body:
        state.level?.pass ??
        'Exit window; grade held; no pack/frac; no panic dogleg.',
      ticketScore: state.ticketScore,
    }
  }
  if (state.outcome === 'wrong_daylight') {
    return {
      headline: 'Daylight — soft teaching gate',
      body: 'Product daylit but grade hold was thin. Retry and hold ±1.5° in the middle.',
      ticketScore: state.ticketScore,
    }
  }
  return {
    headline: 'Debrief',
    body: state.level?.failSentence ?? '',
    ticketScore: state.ticketScore,
  }
}

/** Emit TickSnap from physics GameState; mutates emitter log. */
export function emitFromGameState(
  emitter: PhysicsEmitterState,
  state: GameState,
): TickSnap {
  const soil = getLesson1Soil()
  const teach = LIGHT_FILL_TEACH
  const next: CauseSnap[] = []
  if (state.taughtFail && CAUSE_META[state.taughtFail]) {
    next.push(CAUSE_META[state.taughtFail])
  }

  emitter.log = logCauseTransitions(
    state.t,
    emitter.causes,
    next,
    emitter.log,
  )
  emitter.causes = next

  const mud = state.level?.mud
  const gradeHoldPct =
    state.gradeHoldSamples > 0
      ? (100 * state.gradeHoldGood) / state.gradeHoldSamples
      : 0

  const apwa = state.profile.apwa.map((m) => ({
    color: m.color,
    type: m.type,
    depth_ft: m.depth_ft,
    sta_ft: m.sta_ft,
    label: `${m.type.toUpperCase()} · ${m.depth_ft.toFixed(1)} ft`,
    role: m.role,
  }))

  return {
    t: state.t,
    phase: state.phase,
    causes: next.slice(),
    verbs: verbsFor(next),
    symptoms: symptomsFor(state, next),
    hud: {
      mudWeight: mud?.weight ?? 8.6,
      viscosity: mud?.viscosity ?? 32,
      pumpGpm: 48 * state.gpmNorm,
      returns: 48 * state.gpmNorm * 0.7,
      annularPsi: 40 + state.gpmNorm * 20,
      pitchDeg: state.pitchDeg,
      depthFt: state.coverDepth_ft,
      stationFt: state.station_ft,
      lateralFt: state.lateral_ft,
      clockHour: angleDegToHour(state.clockAngleDeg),
      clockAngleDeg: state.clockAngleDeg,
      targetDepthFt: state.profile.targetDepth_ft,
      signalBars: 5,
      apwa,
      gradeHoldPct,
      packOff: state.gpmNorm < 0.1 ? 0.6 : 0.05,
      steerAuthority: soil.steerAuthority,
      rop: state.rop_m_s,
      cleanIndex: 80,
      tankVolume: 80,
      mixerOn: state.gpmNorm > 0.2,
      gel: teach.gradeHoldPass,
    },
    flags: {
      taughtFail: state.taughtFail,
      daylight: state.outcome === 'daylight',
      wrongDaylightSoft: state.outcome === 'wrong_daylight',
      cleanPass: state.outcome === 'daylight' && !state.taughtFail,
    },
    debrief: debriefFor(state),
  }
}

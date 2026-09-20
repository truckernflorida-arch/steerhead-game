/**
 * Build TickSnap from live GameState (Lesson 1 dirt feel).
 * Hard causes: TF_UTILITY_STRIKE, TF_TOO_DEEP (+ secondary GPM).
 * TF_PANIC_DOGLEG is warn-only (symptom), not a taught hard fail.
 */
import type { GameState } from '../state'
import { ROD_LENGTH_FT } from '../state'
import { getLesson1Soil, LIGHT_FILL_TEACH } from '../env/soil'
import { angleDegToHour } from '../input/clock'
import { buildSteerCue, hazardLateralCue } from '../bore/targetSteering'
import { checkUtilityStrike } from '../collision/utilities'
import type { CauseLog, CauseSnap, TickSnap, VerbSnap } from './types'
import { logCauseTransitions } from './causeLog'

const CAUSE_META: Record<string, CauseSnap> = {
  TF_UTILITY_STRIKE: {
    id: 'TF_UTILITY_STRIKE',
    label: 'Utility strike — hit locate (gas / water / telecom)',
    tag: 'strike',
  },
  TF_TOO_DEEP: {
    id: 'TF_TOO_DEEP',
    label: 'Too deep — buried past safe cover / frac risk',
    tag: 'depth',
  },
  TF_PANIC_DOGLEG: {
    id: 'TF_PANIC_DOGLEG',
    label: 'Panic dogleg — over-steer inventing bend in easy dirt',
    tag: 'steer-warn',
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
  if (ids.has('TF_UTILITY_STRIKE')) {
    chips.push({ id: 'RV_EASE_THRUST', label: 'Ease thrust', enabled: true })
    chips.push({ id: 'RV_HOLD_RPM', label: 'Hold / back off', enabled: true })
  }
  if (ids.has('TF_TOO_DEEP')) {
    chips.push({ id: 'RV_HOLD_RPM', label: 'Climb / flatten', enabled: true })
    chips.push({ id: 'RV_EASE_THRUST', label: 'Ease thrust', enabled: true })
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
  if (state.panicDoglegWarn && state.taughtFail !== 'TF_PANIC_DOGLEG') {
    s.push({ id: 'oversteer', label: 'OVER-STEER', severity: 'warn' })
  }
  for (const c of causes) {
    if (c.id === 'TF_UTILITY_STRIKE') {
      s.push({ id: 'utility_strike', label: 'UTILITY STRIKE', severity: 'critical' })
    }
    if (c.id === 'TF_TOO_DEEP') {
      s.push({ id: 'too_deep', label: 'TOO DEEP', severity: 'critical' })
    }
    if (c.id === 'TF_PANIC_DOGLEG') {
      s.push({ id: 'panic_dogleg', label: 'PANIC DOGLEG', severity: 'warn' })
    }
    if (c.id === 'TF_PACKED_HEAD') {
      s.push({ id: 'packed', label: 'HEAD PACKED', severity: 'critical' })
    }
    if (c.id === 'TF_FRAC_THIN') {
      s.push({ id: 'frac', label: 'FRAC RISK', severity: 'critical' })
    }
  }
  const utilProx = checkUtilityStrike({
    station_ft: state.station_ft,
    coverDepth_ft: state.coverDepth_ft,
    lateral_ft: state.lateral_ft,
    apwa: state.profile.apwa,
  })
  if (
    utilProx.closing &&
    !utilProx.strike &&
    state.taughtFail !== 'TF_UTILITY_STRIKE'
  ) {
    const side =
      utilProx.clearCue === 'left'
        ? 'COME LEFT'
        : utilProx.clearCue === 'right'
          ? 'COME RIGHT'
          : 'CLEAR L/R'
    const name = (utilProx.utilityType ?? 'locate').toUpperCase()
    s.push({
      id: 'locate_closing',
      label: `${side} · ${name} CLOSE`,
      severity: 'warn',
    })
  }
  if (state.gpmNorm < 0.3) {
    s.push({ id: 'gpm_low', label: 'GPM LOW', severity: 'warn' })
  }
  if (state.outcome === 'daylight') {
    s.push({ id: 'daylight', label: 'DAYLIGHT', severity: 'info' })
  }
  if (state.outcome === 'wrong_daylight') {
    s.push({ id: 'wrong_daylight', label: 'EXIT OFF WINDOW', severity: 'warn' })
  }
  const gradeHoldPct =
    state.gradeHoldSamples > 0
      ? (100 * state.gradeHoldGood) / state.gradeHoldSamples
      : 100
  if (
    state.outcome === 'daylight' &&
    state.gradeHoldSamples >= 8 &&
    gradeHoldPct < LIGHT_FILL_TEACH.gradeHoldPass * 100
  ) {
    s.push({
      id: 'grade_soft',
      label: `GRADE HOLD ${gradeHoldPct.toFixed(0)}%`,
      severity: 'warn',
    })
  }
  return s
}

function debriefFor(state: GameState): TickSnap['debrief'] | undefined {
  if (state.phase !== 'debrief') return undefined
  const gradeHoldPct =
    state.gradeHoldSamples > 0
      ? (100 * state.gradeHoldGood) / state.gradeHoldSamples
      : 0

  if (state.taughtFail && CAUSE_META[state.taughtFail]) {
    const cause = CAUSE_META[state.taughtFail]
    let body =
      state.level?.failSentence ??
      'Real job fail — strike a utility or bury the head and the ticket dies.'
    if (state.taughtFail === 'TF_UTILITY_STRIKE') {
      body =
        'You got too close to a painted locate (gas / water / telecom). Offset locates need a small clock 3 / 9 correction — clearance is the job.'
    } else if (state.taughtFail === 'TF_TOO_DEEP') {
      body =
        'Cover went past the safe depth band — that is frac / bury territory. Climb earlier next time.'
    }
    return {
      headline: cause.label,
      body,
      ticketScore: state.ticketScore,
    }
  }
  if (state.outcome === 'daylight') {
    const gradeNote =
      state.gradeHoldSamples >= 8 &&
      gradeHoldPct < LIGHT_FILL_TEACH.gradeHoldPass * 100
        ? ` Pass with notes: grade hold ${gradeHoldPct.toFixed(0)}% (soft score only — you missed utilities).`
        : ''
    return {
      headline: 'Daylight — clean pass',
      body:
        (state.level?.pass ??
          'Exit window; no utility strike; no bury.') + gradeNote,
      ticketScore: state.ticketScore,
    }
  }
  if (state.outcome === 'wrong_daylight') {
    return {
      headline: 'Daylight — exit outside window (soft)',
      body: `You reached the far end but cover was still deep (~${state.coverDepth_ft.toFixed(1)} ft). Soft fail on exit window — not a mystery steer fail. Grade hold ${gradeHoldPct.toFixed(0)}% soft-scores the ticket.`,
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

  const apwa = state.profile.apwa.map((m) => {
    const offset = m.offset_ft ?? 0
    const side =
      Math.abs(offset) < 0.15
        ? ''
        : offset > 0
          ? ` · +${offset.toFixed(1)}R`
          : ` · ${offset.toFixed(1)}L`
    return {
      color: m.color,
      type: m.type,
      depth_ft: m.depth_ft,
      sta_ft: m.sta_ft,
      offset_ft: m.offset_ft,
      label: `${m.type.toUpperCase()} · ${m.depth_ft.toFixed(1)} ft${side}`,
      role: m.role,
    }
  })

  return {
    t: state.t,
    phase: state.phase,
    causes: next.slice(),
    verbs: verbsFor(next),
    symptoms: symptomsFor(state, next),
    hud: (() => {
      const targetPitch = state.targetPitchDeg
      const hazard = hazardLateralCue({
        station_ft: state.station_ft,
        coverDepth_ft: state.coverDepth_ft,
        lateral_ft: state.lateral_ft,
        apwa: state.profile.apwa,
      })
      const cue = buildSteerCue(
        state.pitchDeg,
        targetPitch,
        state.lateral_ft,
        state.profile.gradeWindow_deg,
        hazard,
      )
      return {
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
        entryPitchDeg: state.entryPitchDeg,
        targetPitchDeg: targetPitch,
        rodIndex: state.rodIndex,
        rodTotal: state.rodTotal,
        rodLengthFt: state.rodLength_ft || ROD_LENGTH_FT,
        targetSteering: {
          mode: 'targetSteering' as const,
          targetPitchDeg: targetPitch,
          actualPitchDeg: state.pitchDeg,
          pitchErrorDeg: state.pitchDeg - targetPitch,
          pitchBand: cue.pitchBand,
          cueLabel: cue.label,
          suggestHour: cue.suggestHour,
          lateralCue: cue.lateralCue,
        },
        packOff: state.gpmNorm < 0.1 ? 0.6 : 0.05,
        steerAuthority: soil.steerAuthority,
        rop: state.rop_m_s,
        cleanIndex: 80,
        tankVolume: 80,
        mixerOn: state.gpmNorm > 0.2,
        gel: teach.gradeHoldPass,
      }
    })(),
    flags: {
      taughtFail: state.taughtFail,
      strike: state.taughtFail === 'TF_UTILITY_STRIKE',
      daylight: state.outcome === 'daylight',
      wrongDaylightSoft: state.outcome === 'wrong_daylight',
      cleanPass:
        state.outcome === 'daylight' &&
        !state.taughtFail &&
        (state.gradeHoldSamples < 8 ||
          gradeHoldPct >= teach.gradeHoldPass * 100),
    },
    debrief: debriefFor(state),
  }
}

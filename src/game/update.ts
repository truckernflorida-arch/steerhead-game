/**
 * Lesson 1 update: dirt / light_fill feel + profile path + daylight.
 * Discrete rod push (default 2 ft) + Just drill (straight) + lateral walk.
 * Thrust/ROP + clock/keyboard steer + mild walkBias; taught-fail TF_PANIC_DOGLEG.
 * Secondary TF_PACKED_HEAD / TF_FRAC_THIN only if player kills GPM.
 */
import type { GameOutcome, GamePhase, GameState } from './state'
import { DEFAULT_PUSH_FT } from './state'
import type { InputFrame } from './input'
import { clockAngleToYaw } from './input/clock'
import {
  clampSteerDeltaDeg,
  getLesson1Soil,
  LIGHT_FILL_TEACH,
} from './env/soil'
import {
  isInHoldBand,
  nearDaylight,
  M_TO_FT,
  FT_TO_M,
} from './bore/profile'
import { scoreLesson1 } from './score/lesson1'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function finalizeScore(state: GameState): number {
  const gradeHold =
    state.gradeHoldSamples > 0
      ? state.gradeHoldGood / state.gradeHoldSamples
      : 0
  const mudBand = 1 // locked green on S01
  const pressureVolumeBand = clamp01(state.gpmNorm)
  const cleanAtPull = 0.8
  const exitBullseye =
    state.outcome === 'daylight'
      ? clamp01(
          1 -
            Math.abs(state.coverDepth_ft) /
              Math.max(0.5, state.profile.exitBullseye_m * M_TO_FT),
        )
      : 0
  const scrapes = Math.min(0.15, state.panicDoglegCount * 0.05)
  return scoreLesson1({
    gradeHold,
    mudBand,
    pressureVolumeBand,
    cleanAtPull,
    exitBullseye,
    pathScrapes: scrapes,
  }).ticket
}

export function update(
  state: GameState,
  input: InputFrame,
  dt: number,
): GameState {
  if (
    dt <= 0 &&
    !input.startPush &&
    !input.retry &&
    !input.pushStep
  ) {
    return state
  }

  const pushLen = Math.max(
    0.5,
    Math.min(10, input.pushLengthFt ?? state.pushLength_ft ?? DEFAULT_PUSH_FT),
  )

  if (input.retry && state.phase === 'debrief') {
    return {
      ...state,
      phase: 'brief',
      t: 0,
      headDepth_m: 0,
      station_ft: 0,
      coverDepth_ft: 0.8,
      lateral_ft: 0,
      pitchDeg: 14,
      rop_m_s: 0,
      boreProgress: 0,
      path: [{ sta_ft: 0, depth_ft: 0.8, offset_ft: 0 }],
      clockAngleDeg: input.clockAngleDeg || 180,
      pushLength_ft: pushLen,
      pendingPush_ft: 0,
      drillStraight: false,
      panicDoglegCount: 0,
      panicDoglegWarn: false,
      taughtFail: undefined,
      gpmNorm: 1,
      walkPhase: 0,
      oversteerTimer: 0,
      gradeHoldGood: 0,
      gradeHoldSamples: 0,
      outcome: 'none',
      ticketScore: 0,
    }
  }

  if (state.phase === 'brief') {
    if (input.startPush) {
      return {
        ...state,
        phase: 'pilot',
        clockAngleDeg: input.clockAngleDeg || state.clockAngleDeg,
        pushLength_ft: pushLen,
      }
    }
    return {
      ...state,
      t: state.t + Math.max(dt, 0),
      clockAngleDeg: input.clockAngleDeg || state.clockAngleDeg,
      pushLength_ft: pushLen,
      rop_m_s: 0,
      drillStraight: false,
      pendingPush_ft: 0,
    }
  }

  if (
    state.phase === 'debrief' ||
    state.taughtFail === 'TF_PANIC_DOGLEG' ||
    state.taughtFail === 'TF_PACKED_HEAD' ||
    state.taughtFail === 'TF_FRAC_THIN' ||
    state.outcome === 'daylight' ||
    state.outcome === 'wrong_daylight'
  ) {
    return {
      ...state,
      phase: 'debrief',
      t: state.t + Math.max(dt, 0),
      rop_m_s: 0,
      clockAngleDeg: input.clockAngleDeg || state.clockAngleDeg,
      pendingPush_ft: 0,
      drillStraight: false,
    }
  }

  if (dt <= 0 && !input.pushStep) return state

  const soil = getLesson1Soil()
  if (!soil.unlocked || soil.fourPack !== 'dirt') return state

  const teach = LIGHT_FILL_TEACH
  const clockAngleDeg = input.clockAngleDeg || state.clockAngleDeg
  const drillStraight = Boolean(input.drillStraight)

  let pendingPush_ft = state.pendingPush_ft
  if (input.pushStep && pendingPush_ft <= 0.01) {
    pendingPush_ft = pushLen
  }

  // Continuous thrust (slider / W / Just drill hold) OR discrete push remainder
  let thrust = clamp01(Math.max(input.thrust, input.touchSpeed))
  if (drillStraight) {
    // Spin & shove teaching: steady straight advance without clock chase
    thrust = Math.max(thrust, 0.55)
  }
  if (pendingPush_ft > 0.01) {
    // Deliberate rod push: moderate ROP until step consumed
    thrust = Math.max(thrust, 0.55)
  }

  const [ropLo, ropHi] = soil.ropRange_m_s
  let rop = 0
  if (thrust > 0.02) {
    if (thrust >= 0.3) {
      rop = lerp(ropLo, ropHi, clamp01((thrust - 0.3) / 0.7))
    } else {
      rop = ropLo * (thrust / 0.3)
    }
  }

  let ds = rop * Math.max(dt, 0)

  // Cap step so we don't overshoot remaining discrete push
  if (pendingPush_ft > 0.01 && ds > 0) {
    const pending_m = pendingPush_ft * FT_TO_M
    if (ds > pending_m) ds = pending_m
    pendingPush_ft = Math.max(0, pendingPush_ft - ds * M_TO_FT)
  }

  // Just drill: ignore clock pitch/yaw (straight). Keyboard thrash still steers
  // so TF_PANIC_DOGLEG remains possible if the player hammers A/D.
  const keyboardThrash = Math.max(
    -1,
    Math.min(1, (input.keys['a'] || input.keys['A'] ? -1 : 0) +
      (input.keys['d'] || input.keys['D'] ? 1 : 0) +
      (input.keys['ArrowLeft'] ? -1 : 0) +
      (input.keys['ArrowRight'] ? 1 : 0)),
  )
  let steerInput: number
  let yawInput: number
  if (drillStraight) {
    steerInput = keyboardThrash * 0.35
    yawInput = 0
  } else {
    steerInput = Math.max(-1, Math.min(1, input.steer))
    yawInput = clockAngleToYaw(clockAngleDeg)
  }

  const dPitchWanted =
    ds > 1e-8
      ? steerInput * soil.steerAuthority * soil.maxSteerDegPerM * ds
      : 0
  let dPitch = clampSteerDeltaDeg(dPitchWanted, ds, soil)

  const walkPhase = state.walkPhase + Math.max(dt, 0)
  const noise = Math.sin(walkPhase * 1.7) * soil.walkNoiseAmp * 0.15 * ds
  // Mild natural walk on pitch; Just drill keeps bias (soil) but no clock bend
  dPitch += soil.walkBias_deg_m * ds + noise

  const pitchDeg = state.pitchDeg + dPitch
  const pitchRad = (pitchDeg * Math.PI) / 180

  const dSta_ft = ds * Math.cos(pitchRad) * M_TO_FT
  const dCover_ft = ds * Math.sin(pitchRad) * M_TO_FT
  // Lateral walk from clock 3/9 (and soil walkLateral noise)
  const dLat =
    ds *
    M_TO_FT *
    (yawInput * soil.steerAuthority * 0.45 +
      Math.sin(walkPhase * 1.1) * soil.walkLateral * 0.5)

  const headDepth_m = Math.min(state.boreLength_m, state.headDepth_m + ds)
  let station_ft = Math.min(
    state.profile.length_ft,
    Math.max(0, state.station_ft + dSta_ft),
  )
  let coverDepth_ft = Math.max(0.05, state.coverDepth_ft + dCover_ft)
  let lateral_ft = Math.max(-20, Math.min(20, state.lateral_ft + dLat))

  const boreProgress =
    state.boreLength_m > 0 ? clamp01(headDepth_m / state.boreLength_m) : 0

  const path = state.path.slice()
  const last = path[path.length - 1]
  if (
    !last ||
    Math.hypot(
      station_ft - last.sta_ft,
      coverDepth_ft - last.depth_ft,
      lateral_ft - (last.offset_ft ?? 0),
    ) > 0.35
  ) {
    path.push({
      sta_ft: station_ft,
      depth_ft: coverDepth_ft,
      offset_ft: lateral_ft,
    })
    if (path.length > 400) path.shift()
  }

  let gradeHoldGood = state.gradeHoldGood
  let gradeHoldSamples = state.gradeHoldSamples
  if (ds > 0 && isInHoldBand(state.profile, station_ft)) {
    gradeHoldSamples += 1
    const depthOk =
      Math.abs(coverDepth_ft - state.profile.targetDepth_ft) <= 1.5
    const pitchOk = Math.abs(pitchDeg) <= teach.gradeWindow_deg
    if (depthOk && pitchOk) gradeHoldGood += 1
  }

  let panicDoglegCount = state.panicDoglegCount
  let panicDoglegWarn = state.panicDoglegWarn
  let taughtFail = state.taughtFail
  let phase: GamePhase = state.phase
  let oversteerTimer = state.oversteerTimer
  let outcome: GameOutcome = state.outcome
  let ticketScore = state.ticketScore

  const bendRate = ds > 1e-4 ? Math.abs(dPitchWanted) / ds : 0
  const oversteering = bendRate > teach.panicDoglegDegPerM

  if (oversteering) {
    oversteerTimer += Math.max(dt, 0)
    if (!panicDoglegWarn && oversteerTimer > 0.35) panicDoglegWarn = true
    if (oversteerTimer > 0.9) {
      panicDoglegCount += 1
      oversteerTimer = 0
      if (panicDoglegCount > teach.panicDoglegWarnCount) {
        taughtFail = 'TF_PANIC_DOGLEG'
        phase = 'debrief'
        outcome = 'taught_fail'
      }
    }
  } else {
    oversteerTimer = Math.max(0, oversteerTimer - Math.max(dt, 0) * 2)
  }

  let nextGpm = state.gpmNorm
  if (input.keys['g'] || input.keys['G']) {
    nextGpm = Math.max(0, state.gpmNorm - 0.5 * Math.max(dt, 0))
  } else if (state.gpmNorm < 1) {
    nextGpm = Math.min(1, state.gpmNorm + 0.2 * Math.max(dt, 0))
  }

  if (!taughtFail && nextGpm < 0.05) {
    if (thrust > 0.5) {
      taughtFail = 'TF_PACKED_HEAD'
      phase = 'debrief'
      outcome = 'taught_fail'
    } else if (thrust < 0.1 && state.t > 3) {
      taughtFail = 'TF_FRAC_THIN'
      phase = 'debrief'
      outcome = 'taught_fail'
    }
  }

  if (
    !taughtFail &&
    nearDaylight(state.profile, station_ft, coverDepth_ft) &&
    boreProgress >= 0.9
  ) {
    const gradeHold =
      gradeHoldSamples > 0 ? gradeHoldGood / gradeHoldSamples : 0
    if (gradeHold >= teach.gradeHoldPass || gradeHoldSamples < 8) {
      outcome = 'daylight'
      phase = 'debrief'
    } else {
      outcome = 'wrong_daylight'
      phase = 'debrief'
    }
  }

  if (coverDepth_ft < 0.15 && boreProgress < 0.85) {
    coverDepth_ft = 0.15
  }

  let next: GameState = {
    ...state,
    t: state.t + Math.max(dt, 0),
    phase,
    headDepth_m,
    station_ft,
    coverDepth_ft,
    lateral_ft,
    pitchDeg,
    rop_m_s: rop,
    boreProgress,
    path,
    clockAngleDeg,
    pushLength_ft: pushLen,
    pendingPush_ft,
    drillStraight,
    panicDoglegCount,
    panicDoglegWarn,
    taughtFail,
    gpmNorm: nextGpm,
    walkPhase,
    oversteerTimer,
    gradeHoldGood,
    gradeHoldSamples,
    outcome,
    ticketScore,
  }

  if (phase === 'debrief' && ticketScore === 0) {
    next = { ...next, ticketScore: finalizeScore(next) }
  }

  return next
}

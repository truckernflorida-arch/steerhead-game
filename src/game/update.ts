/**
 * Lesson 1 update: dirt / light_fill feel only.
 * Thrust/ROP + steer clamp + mild walkBias; taught-fail TF_PANIC_DOGLEG.
 * No FC-01 / plant fails unless player kills GPM (secondary rails).
 */
import type { GamePhase, GameState } from './state'
import type { InputFrame } from './input'
import {
  clampSteerDeltaDeg,
  getLesson1Soil,
  LIGHT_FILL_TEACH,
} from './env/soil'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/**
 * Pure update: (state, input, dt) → next.
 * Always uses unlocked dirt params — never sand/clay/rock gameplay.
 */
export function update(
  state: GameState,
  input: InputFrame,
  dt: number,
): GameState {
  if (dt <= 0) return state
  if (
    state.phase === 'debrief' ||
    state.taughtFail === 'TF_PANIC_DOGLEG' ||
    state.taughtFail === 'TF_PACKED_HEAD' ||
    state.taughtFail === 'TF_FRAC_THIN'
  ) {
    return { ...state, t: state.t + dt, rop_m_s: 0 }
  }

  // CEO lock: L1 uses dirt/light_fill numbers only (unlocked)
  const soil = getLesson1Soil()
  if (!soil.unlocked || soil.fourPack !== 'dirt') {
    return state
  }

  const teach = LIGHT_FILL_TEACH

  // Thrust: keyboard thrust or touch speed slider
  const thrust = clamp01(Math.max(input.thrust, input.touchSpeed))

  // ROP: dirt ropRange_m_s at thrust 0.3–1.0; taper below 0.3
  const [ropLo, ropHi] = soil.ropRange_m_s
  let rop = 0
  if (thrust > 0.02) {
    if (thrust >= 0.3) {
      rop = lerp(ropLo, ropHi, clamp01((thrust - 0.3) / 0.7))
    } else {
      rop = ropLo * (thrust / 0.3)
    }
    // Published ropRange already encodes dirt thrustResponse (1.15) vs baseline
  }

  const ds = rop * dt

  // Steer: authority scales wanted bend; hard clamp to maxSteerDegPerM * ds
  const steerInput = Math.max(-1, Math.min(1, input.steer))
  const dPitchWanted =
    ds > 1e-8
      ? steerInput * soil.steerAuthority * soil.maxSteerDegPerM * ds
      : 0
  let dPitch = clampSteerDeltaDeg(dPitchWanted, ds, soil)

  // Mild walkBias (+ dive) + tiny noise
  const walkPhase = state.walkPhase + dt
  const noise = Math.sin(walkPhase * 1.7) * soil.walkNoiseAmp * 0.15 * ds
  dPitch += soil.walkBias_deg_m * ds + noise

  const pitchDeg = state.pitchDeg + dPitch
  const headDepth_m = Math.min(state.boreLength_m, state.headDepth_m + ds)
  const boreProgress =
    state.boreLength_m > 0 ? clamp01(headDepth_m / state.boreLength_m) : 0

  // --- Fail cascades (minimal L1) ---
  // Primary: TF_PANIC_DOGLEG — discrete over-steer events (edge + sustain)
  let panicDoglegCount = state.panicDoglegCount
  let panicDoglegWarn = state.panicDoglegWarn
  let taughtFail = state.taughtFail
  let phase: GamePhase = state.phase
  let oversteerTimer = state.oversteerTimer

  const bendRate = ds > 1e-4 ? Math.abs(dPitchWanted) / ds : 0
  const oversteering = bendRate > teach.panicDoglegDegPerM

  if (oversteering) {
    oversteerTimer += dt
    if (!panicDoglegWarn && oversteerTimer > 0.35) {
      panicDoglegWarn = true
    }
    // Count one panic event after sustained over-steer (~0.9s)
    if (oversteerTimer > 0.9) {
      panicDoglegCount += 1
      oversteerTimer = 0
      if (panicDoglegCount > teach.panicDoglegWarnCount) {
        taughtFail = 'TF_PANIC_DOGLEG'
        phase = 'debrief'
      }
    }
  } else {
    oversteerTimer = Math.max(0, oversteerTimer - dt * 2)
  }

  // Secondary: TF_PACKED_HEAD / TF_FRAC_THIN only when player kills GPM
  // Hold G to starve GPM (debug rail); no plant script / FC-01 on L1
  let nextGpm = state.gpmNorm
  if (input.keys['g'] || input.keys['G']) {
    nextGpm = Math.max(0, state.gpmNorm - 0.5 * dt)
  } else if (state.gpmNorm < 1) {
    nextGpm = Math.min(1, state.gpmNorm + 0.2 * dt)
  }

  if (!taughtFail && nextGpm < 0.05) {
    if (thrust > 0.5) {
      taughtFail = 'TF_PACKED_HEAD'
      phase = 'debrief'
    } else if (thrust < 0.1 && state.t > 3) {
      taughtFail = 'TF_FRAC_THIN'
      phase = 'debrief'
    }
  }

  return {
    ...state,
    t: state.t + dt,
    phase,
    headDepth_m,
    pitchDeg,
    rop_m_s: rop,
    boreProgress,
    panicDoglegCount,
    panicDoglegWarn,
    taughtFail,
    gpmNorm: nextGpm,
    walkPhase,
    oversteerTimer,
  }
}

/**
 * Locator TARGET STEERING mode — Falcon-style target vs actual pitch/clock cues.
 * Guidance only; fails still come from TickSnap causes (no UI invention).
 * Lateral: clock 3 = right, 9 = left. Offset locates cue COME LEFT / COME RIGHT.
 */
import { idealDepthAtSta, type ApwaMark, type ProfilePlan } from './profile'

/** Ideal pitch (°). HDD sign: − dive / + climb. Depth plan is +down. */
export function idealPitchAtSta(plan: ProfilePlan, sta_ft: number): number {
  const eps = 0.75
  const d0 = idealDepthAtSta(plan, Math.max(0, sta_ft - eps * 0.5))
  const d1 = idealDepthAtSta(plan, Math.min(plan.length_ft, sta_ft + eps * 0.5))
  const run = Math.min(plan.length_ft, sta_ft + eps * 0.5) - Math.max(0, sta_ft - eps * 0.5)
  if (run < 1e-6) return 0
  // Negate: going deeper (d1>d0) is dive → negative pitch
  return (-Math.atan2(d1 - d0, run) * 180) / Math.PI
}

export type SteerCue = {
  /** Short HUD label */
  label: string
  /** Suggested clock hour (1–12) for correction, or null if hold */
  suggestHour: number | null
  /** Pitch band status */
  pitchBand: 'low' | 'in' | 'high'
  /** Lateral cue */
  lateralCue: 'left' | 'hold' | 'right'
}

/** Approach window (ft) ahead of an offset locate where L/R teaching cues fire. */
const HAZARD_APPROACH_FT = 18
const HAZARD_PAST_FT = 3
/** Clearance target past the locate envelope (ft beyond LAT_HIT ~2.25). */
const CLEAR_MARGIN_FT = 1.0
const LAT_HIT_FT = 2.25

function clearanceScale(clearance?: string): number {
  if (clearance === 'tight') return 0.75
  if (clearance === 'wide') return 1.15
  return 1
}

/**
 * If an offset crossing locate is ahead and head is on a collision course,
 * return the L/R clear direction (clock 9 left / 3 right).
 */
export function hazardLateralCue(opts: {
  station_ft: number
  coverDepth_ft: number
  lateral_ft: number
  apwa: ApwaMark[]
}): { cue: 'left' | 'right'; mark: ApwaMark } | null {
  let best: { cue: 'left' | 'right'; mark: ApwaMark; dSta: number } | null =
    null
  for (const m of opts.apwa) {
    if (m.role === 'parallel_brief_only') continue
    const sta = m.sta_ft
    if (sta == null || !Number.isFinite(sta)) continue
    const offset = m.offset_ft ?? 0
    // Only teach on deliberately offset locates (on-ROW stay depth/pitch problem)
    if (Math.abs(offset) < 0.4) continue
    const dSta = sta - opts.station_ft
    if (dSta < -HAZARD_PAST_FT || dSta > HAZARD_APPROACH_FT) continue
    const scale = clearanceScale(m.clearance)
    const latHit = LAT_HIT_FT * scale
    const depthHit = 1.35 * scale
    const dDepth = Math.abs(opts.coverDepth_ft - m.depth_ft)
    // Only cue if depth path would clip (otherwise lateral is free)
    if (dDepth > depthHit * 1.6) continue
    const clearLeft = offset - latHit - CLEAR_MARGIN_FT
    const clearRight = offset + latHit + CLEAR_MARGIN_FT
    const onCourse =
      opts.lateral_ft > clearLeft && opts.lateral_ft < clearRight
    if (!onCourse) continue
    // Prefer the shorter escape: left of blob vs right of blob
    const distLeft = Math.abs(opts.lateral_ft - clearLeft)
    const distRight = Math.abs(opts.lateral_ft - clearRight)
    const cue: 'left' | 'right' = distLeft <= distRight ? 'left' : 'right'
    if (!best || dSta < best.dSta) {
      best = { cue, mark: m, dSta }
    }
  }
  return best ? { cue: best.cue, mark: best.mark } : null
}

export function buildSteerCue(
  actualPitchDeg: number,
  targetPitchDeg: number,
  lateral_ft: number,
  gradeWindow_deg: number,
  hazard?: { cue: 'left' | 'right' } | null,
): SteerCue {
  const err = actualPitchDeg - targetPitchDeg
  const half = Math.max(0.4, gradeWindow_deg)
  let pitchBand: SteerCue['pitchBand'] = 'in'
  // HDD: − dive / + climb. More negative than target = too much dive.
  if (err < -half) pitchBand = 'high' // too much dive
  else if (err > half) pitchBand = 'low' // too flat / climbing vs target

  let lateralCue: SteerCue['lateralCue'] = 'hold'
  if (hazard?.cue === 'left') lateralCue = 'left'
  else if (hazard?.cue === 'right') lateralCue = 'right'
  else if (lateral_ft > 1.0) lateralCue = 'left' // right of CL → steer left (9)
  else if (lateral_ft < -1.0) lateralCue = 'right'

  // Clock: 6 = dive, 12 = climb/level, 3 = right, 9 = left
  let suggestHour: number | null = null
  let label = 'HOLD · ON TARGET'

  const hazardPriority = Boolean(hazard?.cue)
  if (hazardPriority && lateralCue === 'left') {
    suggestHour = pitchBand === 'high' ? 10 : pitchBand === 'low' ? 8 : 9
    label =
      pitchBand === 'in'
        ? 'COME LEFT · CLEAR LOCATE'
        : pitchBand === 'high'
          ? 'COME LEFT + UP'
          : 'COME LEFT + DOWN'
  } else if (hazardPriority && lateralCue === 'right') {
    suggestHour = pitchBand === 'high' ? 2 : pitchBand === 'low' ? 4 : 3
    label =
      pitchBand === 'in'
        ? 'COME RIGHT · CLEAR LOCATE'
        : pitchBand === 'high'
          ? 'COME RIGHT + UP'
          : 'COME RIGHT + DOWN'
  } else if (pitchBand === 'high' && lateralCue === 'hold') {
    suggestHour = 12
    label = 'STEER UP · LESS DIVE'
  } else if (pitchBand === 'low' && lateralCue === 'hold') {
    suggestHour = 6
    label = 'STEER DOWN · MORE DIVE'
  } else if (pitchBand === 'in' && lateralCue === 'left') {
    suggestHour = 9
    label = 'STEER LEFT · BACK TO ROW'
  } else if (pitchBand === 'in' && lateralCue === 'right') {
    suggestHour = 3
    label = 'STEER RIGHT · BACK TO ROW'
  } else if (pitchBand === 'high' && lateralCue === 'left') {
    suggestHour = 10
    label = 'UP + LEFT'
  } else if (pitchBand === 'high' && lateralCue === 'right') {
    suggestHour = 2
    label = 'UP + RIGHT'
  } else if (pitchBand === 'low' && lateralCue === 'left') {
    suggestHour = 8
    label = 'DOWN + LEFT'
  } else if (pitchBand === 'low' && lateralCue === 'right') {
    suggestHour = 4
    label = 'DOWN + RIGHT'
  }

  return { label, suggestHour, pitchBand, lateralCue }
}

export function rodIndexFromStation(station_ft: number, rodLength_ft: number): number {
  return Math.max(1, Math.floor(station_ft / Math.max(1, rodLength_ft)) + 1)
}

export function rodTotalFromLength(length_ft: number, rodLength_ft: number): number {
  return Math.max(1, Math.ceil(length_ft / Math.max(1, rodLength_ft)))
}

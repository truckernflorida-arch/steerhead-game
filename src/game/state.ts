/**
 * GameState — Lesson 1 default = S01 Dirt Yard / light_fill (dirt).
 * Crew workflow: rig entry pitch, 10 ft rods, target steering along curved ROW.
 */
import type { JobCard } from './levels/jobCard'
import { LESSON1_LEVEL_ID } from './levels/loadSchool'
import { LESSON1_SOIL_ID, type SoilAliasId } from './env/soil'
import type { CauseId } from './ticksnap/types'
import {
  planFromLevel,
  type BorePoint,
  type ProfilePlan,
  FT_TO_M,
} from './bore/profile'
import {
  rodIndexFromStation,
  rodTotalFromLength,
} from './bore/targetSteering'
import { worldFromStation } from './bore/centerline'

export type GamePhase = 'brief' | 'mix' | 'pilot' | 'ream' | 'pull' | 'debrief'

export type GameOutcome =
  | 'none'
  | 'daylight'
  | 'taught_fail'
  | 'wrong_daylight'

/** Active rod length shown in HUD (ft) — first-class teaching constant */
export const ROD_LENGTH_FT = 10
/** Default discrete push step (ft) */
export const DEFAULT_PUSH_FT = 2
/** Default rig / bit entry pitch before Spud (° dive) */
export const DEFAULT_ENTRY_PITCH_DEG = 14
export const ENTRY_PITCH_MIN = 4
export const ENTRY_PITCH_MAX = 22

export type GameState = {
  levelId: string
  level: JobCard | null
  phase: GamePhase
  t: number
  soilId: SoilAliasId
  /** Path length along hole (meters) */
  headDepth_m: number
  /** Horizontal station along curved centerline (ft) */
  station_ft: number
  /** Cover depth below grade (ft), positive down */
  coverDepth_ft: number
  /** Lateral offset (ft): + = right of planned centerline, − = left */
  lateral_ft: number
  /** Plan-view world X along curved ROW (ft) */
  worldX_ft: number
  /** Plan-view world Y along curved ROW (ft) */
  worldY_ft: number
  /** Pitch degrees (+ dive) */
  pitchDeg: number
  /** Rig setup entry pitch (° dive) — seeds pitchDeg on Spud */
  entryPitchDeg: number
  /** Ideal / target pitch from depth plan at current station */
  targetPitchDeg: number
  rop_m_s: number
  boreProgress: number
  boreLength_m: number
  profile: ProfilePlan
  path: BorePoint[]
  clockAngleDeg: number
  /** Active rod length (ft) — display / teaching */
  rodLength_ft: number
  /** 1-based rod index along shot */
  rodIndex: number
  /** Total rods for this shot length */
  rodTotal: number
  /** Chosen discrete push length (ft) */
  pushLength_ft: number
  /** Remaining discrete push to consume (ft along path) */
  pendingPush_ft: number
  /** True while Just drill (straight) is held */
  drillStraight: boolean
  panicDoglegCount: number
  panicDoglegWarn: boolean
  taughtFail?: CauseId
  gpmNorm: number
  walkPhase: number
  oversteerTimer: number
  gradeHoldGood: number
  gradeHoldSamples: number
  outcome: GameOutcome
  ticketScore: number
}

export function createGameState(level: JobCard | null = null): GameState {
  const lengthFt = level?.bore?.length_ft ?? 120
  const profile = planFromLevel(level ?? {})
  const entryPitchDeg = DEFAULT_ENTRY_PITCH_DEG
  const origin = worldFromStation(profile.centerline, 0, 0)
  const rodTotal = rodTotalFromLength(lengthFt, ROD_LENGTH_FT)
  return {
    levelId: level?.id ?? LESSON1_LEVEL_ID,
    level,
    phase: 'brief',
    t: 0,
    soilId: LESSON1_SOIL_ID,
    headDepth_m: 0,
    station_ft: 0,
    coverDepth_ft: 0.8,
    lateral_ft: 0,
    worldX_ft: origin.x_ft,
    worldY_ft: origin.y_ft,
    pitchDeg: entryPitchDeg,
    entryPitchDeg,
    targetPitchDeg: entryPitchDeg,
    rop_m_s: 0,
    boreProgress: 0,
    boreLength_m: lengthFt * FT_TO_M,
    profile,
    path: [
      {
        sta_ft: 0,
        depth_ft: 0.8,
        offset_ft: 0,
        x_ft: origin.x_ft,
        y_ft: origin.y_ft,
      },
    ],
    clockAngleDeg: 180,
    rodLength_ft: ROD_LENGTH_FT,
    rodIndex: 1,
    rodTotal,
    pushLength_ft: DEFAULT_PUSH_FT,
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

export function resetGameState(state: GameState): GameState {
  return createGameState(state.level)
}

export { rodIndexFromStation, rodTotalFromLength }

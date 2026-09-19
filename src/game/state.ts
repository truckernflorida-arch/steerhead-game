/**
 * GameState — Lesson 1 default = S01 Dirt Yard / light_fill (dirt).
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

export type GamePhase = 'brief' | 'mix' | 'pilot' | 'ream' | 'pull' | 'debrief'

export type GameOutcome =
  | 'none'
  | 'daylight'
  | 'taught_fail'
  | 'wrong_daylight'

export type GameState = {
  levelId: string
  level: JobCard | null
  phase: GamePhase
  t: number
  soilId: SoilAliasId
  /** Path length along hole (meters) */
  headDepth_m: number
  /** Horizontal station (ft) */
  station_ft: number
  /** Cover depth below grade (ft), positive down */
  coverDepth_ft: number
  /** Pitch degrees (+ dive) */
  pitchDeg: number
  rop_m_s: number
  boreProgress: number
  boreLength_m: number
  profile: ProfilePlan
  path: BorePoint[]
  clockAngleDeg: number
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
  return {
    levelId: level?.id ?? LESSON1_LEVEL_ID,
    level,
    phase: 'brief',
    t: 0,
    soilId: LESSON1_SOIL_ID,
    headDepth_m: 0,
    station_ft: 0,
    coverDepth_ft: 0.8,
    pitchDeg: 14,
    rop_m_s: 0,
    boreProgress: 0,
    boreLength_m: lengthFt * FT_TO_M,
    profile,
    path: [{ sta_ft: 0, depth_ft: 0.8 }],
    clockAngleDeg: 180,
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

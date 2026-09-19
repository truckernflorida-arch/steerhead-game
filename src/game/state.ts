/**
 * GameState — Lesson 1 default = S01 Dirt Yard / light_fill (dirt).
 */
import type { SchoolLevel } from './levels/jobCard'
import { LESSON1_LEVEL_ID } from './levels/loadSchool'
import { LESSON1_SOIL_ID, type SoilAliasId } from './env/soil'
import type { CauseId } from './ticksnap/types'

export type GamePhase = 'brief' | 'mix' | 'pilot' | 'ream' | 'pull' | 'debrief'

export type GameState = {
  levelId: string
  /** Job card metadata from school JSON (S01 default) */
  level: SchoolLevel | null
  phase: GamePhase
  /** Sim time seconds */
  t: number
  /** Soil school id (light_fill for L1) */
  soilId: SoilAliasId
  /** Head depth along bore path (meters) */
  headDepth_m: number
  /** Pitch degrees (+ dive with walkBias) */
  pitchDeg: number
  /** Instantaneous ROP m/s */
  rop_m_s: number
  /** Bore progress 0–1 */
  boreProgress: number
  /** Target bore length meters (from job card ft) */
  boreLength_m: number
  /** Accumulated panic-dogleg events this run */
  panicDoglegCount: number
  /** Soft warn before taught-fail */
  panicDoglegWarn: boolean
  /** Active taught-fail cause id, if any */
  taughtFail?: CauseId
  /** Locked mud GPM proxy 0..1 (1 = healthy; kill → secondary fails) */
  gpmNorm: number
  /** Sticky walk noise phase */
  walkPhase: number
  /** Sustained over-steer timer (s) for panic dogleg */
  oversteerTimer: number
}

const FT_TO_M = 0.3048

export function createGameState(level: SchoolLevel | null = null): GameState {
  const lengthFt = level?.bore?.length_ft ?? 120
  return {
    levelId: level?.id ?? LESSON1_LEVEL_ID,
    level,
    phase: 'pilot',
    t: 0,
    soilId: LESSON1_SOIL_ID,
    headDepth_m: 0,
    pitchDeg: 0,
    rop_m_s: 0,
    boreProgress: 0,
    boreLength_m: lengthFt * FT_TO_M,
    panicDoglegCount: 0,
    panicDoglegWarn: false,
    taughtFail: undefined,
    gpmNorm: 1,
    walkPhase: 0,
    oversteerTimer: 0,
  }
}

export function resetGameState(state: GameState): GameState {
  return createGameState(state.level)
}

/**
 * Lesson 1 ticket score — weights FROZEN (do not rebalance).
 * 0.30·gradeHold + 0.25·mudBand% + 0.25·pressureVolumeBand%
 * + 0.15·cleanAtPull + 0.05·exitBullseye − path scrapes (cap −15%)
 */
export const SCORE_WEIGHTS = {
  gradeHold: 0.3,
  mudBand: 0.25,
  pressureVolumeBand: 0.25,
  cleanAtPull: 0.15,
  exitBullseye: 0.05,
  pathScrapesCap: 0.15,
} as const

export type Lesson1ScoreInputs = {
  gradeHold: number
  mudBand: number
  pressureVolumeBand: number
  cleanAtPull: number
  exitBullseye: number
  /** 0..1 scrape penalty before cap */
  pathScrapes?: number
}

export type Lesson1Score = {
  ticket: number
  parts: Record<keyof typeof SCORE_WEIGHTS, number>
}

export function scoreLesson1(input: Lesson1ScoreInputs): Lesson1Score {
  const scrapes = Math.min(
    SCORE_WEIGHTS.pathScrapesCap,
    Math.max(0, input.pathScrapes ?? 0),
  )
  const parts = {
    gradeHold: SCORE_WEIGHTS.gradeHold * clamp01(input.gradeHold),
    mudBand: SCORE_WEIGHTS.mudBand * clamp01(input.mudBand),
    pressureVolumeBand:
      SCORE_WEIGHTS.pressureVolumeBand * clamp01(input.pressureVolumeBand),
    cleanAtPull: SCORE_WEIGHTS.cleanAtPull * clamp01(input.cleanAtPull),
    exitBullseye: SCORE_WEIGHTS.exitBullseye * clamp01(input.exitBullseye),
    pathScrapesCap: -scrapes,
  }
  const ticket = clamp01(
    parts.gradeHold +
      parts.mudBand +
      parts.pressureVolumeBand +
      parts.cleanAtPull +
      parts.exitBullseye +
      parts.pathScrapesCap,
  )
  return { ticket, parts }
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

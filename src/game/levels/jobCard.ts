/**
 * School job card types + light normalize/validate.
 * Required fields per ARCHITECTURE.md — no invented soil numbers.
 */
export type SchoolMud = {
  weight?: number
  viscosity?: number
  bentonite?: string
  polymer?: string
  locked?: boolean
  playerMixed?: boolean
}

export type SchoolBore = {
  length_ft?: number
  targetDepth_ft?: number
  gradeWindow_deg?: number
  exit?: string
  exitBullseye_m?: number
}

export type SchoolLevel = {
  id: string
  title: string
  lesson?: string
  soilClass: string[]
  mud: SchoolMud
  plantFail: string
  pass: string
  failSentence: string
  rev?: number
  spineLesson?: number
  mapsTo?: string
  bore?: SchoolBore
  apwa?: unknown[]
  debriefChecklist?: string[]
  [key: string]: unknown
}

export type JobCard = SchoolLevel & {
  /** Normalized display title (Bible: “S01 — Dirt Yard”) */
  bibleTitle: string
}

export function normalizeJobCard(level: SchoolLevel): JobCard {
  const bibleTitle =
    level.id === 'S01' ? 'S01 — Dirt Yard' : `${level.id} — ${level.title}`
  return { ...level, bibleTitle }
}

export function validateJobCard(level: SchoolLevel): string[] {
  const errs: string[] = []
  if (!level.id) errs.push('missing id')
  if (!level.soilClass?.length) errs.push('missing soilClass')
  if (!level.mud) errs.push('missing mud')
  if (level.plantFail == null) errs.push('missing plantFail')
  if (!level.pass) errs.push('missing pass')
  if (!level.failSentence) errs.push('missing failSentence')
  return errs
}

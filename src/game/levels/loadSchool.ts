/**
 * Load mud_plant_school levels from bundled school-s01-s12.json.
 * Default Lesson 1 = S01 only (NOT SR01).
 */
import schoolJson from './school-s01-s12.json'
import {
  normalizeJobCard,
  validateJobCard,
  type JobCard,
  type SchoolLevel,
} from './jobCard'

export const LESSON1_LEVEL_ID = 'S01' as const

type SchoolFile = {
  campaign?: string
  version?: number | string
  levels: SchoolLevel[]
}

const data = schoolJson as SchoolFile

export function listSchoolLevels(): SchoolLevel[] {
  return data.levels.slice()
}

export function loadSchoolLevel(id: string = LESSON1_LEVEL_ID): JobCard {
  const raw = data.levels.find((l) => l.id === id)
  if (!raw) {
    throw new Error(`School level not found: ${id}`)
  }
  const errs = validateJobCard(raw)
  if (errs.length) {
    throw new Error(`Invalid job card ${id}: ${errs.join(', ')}`)
  }
  return normalizeJobCard(raw)
}

/** Lesson 1 default — Dirt Yard / light_fill / mud.locked / 120 ft */
export function loadLesson1(): JobCard {
  return loadSchoolLevel(LESSON1_LEVEL_ID)
}

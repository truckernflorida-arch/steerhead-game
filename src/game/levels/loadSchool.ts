/**
 * Load mud_plant_school levels from bundled school-s01-s12.json.
 * Default Lesson 1 = S01 only (NOT SR01).
 * S01 locate tickets: Bot 5 s01-locate-tickets.json is source of truth (rev 3).
 */
import schoolJson from './school-s01-s12.json'
import {
  loadS01LocateTickets,
  s01ApwaFromTickets,
  s01ViewPrimary,
} from './locateTickets'
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

/** Apply Bot 5 official S01 tickets onto the school card (apwa + locateTickets + view). */
function applyS01Tickets(raw: SchoolLevel): SchoolLevel {
  const tickets = loadS01LocateTickets()
  const apwa = s01ApwaFromTickets().map((m) => ({
    id: m.id,
    apwa: m.color,
    color: m.color,
    type: m.type,
    label: m.label,
    depth_ft: m.depth_ft,
    sta_ft: m.sta_ft,
    offset_ft: m.offset_ft,
    offsetFromCL_ft: m.offset_ft,
    crossesCL: m.crossesCL,
    clearance: m.clearance,
    role: m.role,
    ticketText: m.ticketText,
  }))
  return {
    ...raw,
    rev: Math.max(Number(raw.rev ?? 0), tickets.rev),
    viewPrimary: s01ViewPrimary(),
    viewSecondary: 'profile',
    locateTickets: tickets.locateTickets,
    apwa,
    centerline: tickets.centerline ?? raw.centerline,
  }
}

export function loadSchoolLevel(id: string = LESSON1_LEVEL_ID): JobCard {
  const raw = data.levels.find((l) => l.id === id)
  if (!raw) {
    throw new Error(`School level not found: ${id}`)
  }
  const merged = id === LESSON1_LEVEL_ID ? applyS01Tickets(raw) : raw
  const errs = validateJobCard(merged)
  if (errs.length) {
    throw new Error(`Invalid job card ${id}: ${errs.join(', ')}`)
  }
  return normalizeJobCard(merged)
}

/** Lesson 1 default — Dirt Yard / light_fill / mud.locked / 120 ft */
export function loadLesson1(): JobCard {
  return loadSchoolLevel(LESSON1_LEVEL_ID)
}

/**
 * S01 profile geometry helpers — entry → hold → utilities → climb → daylight.
 * Units: feet for locator/HUD; meters internally where physics uses m.
 * Extended: curved road ROW centerline + ground locates for map paint.
 * APWA marks prefer Bot 5 locateTickets (offsetFromCL_ft / crossesCL) when present.
 */
import {
  sampleCenterline,
  groundLocatesFromPlan,
  type CenterlineSample,
  type GroundLocate,
} from './centerline'
import { s01ApwaFromTickets } from '../levels/locateTickets'

export const FT_TO_M = 0.3048
export const M_TO_FT = 1 / FT_TO_M

export type BorePoint = {
  /** Horizontal station along planned shot (ft) */
  sta_ft: number
  /** Cover depth below grade (ft), positive down */
  depth_ft: number
  /** Lateral offset (ft): + right / − left of centerline */
  offset_ft?: number
  /** Plan world X along curved ROW (ft) */
  x_ft?: number
  /** Plan world Y along curved ROW (ft) */
  y_ft?: number
}

export type ApwaMark = {
  color: 'yellow' | 'blue' | string
  type: string
  depth_ft: number
  sta_ft?: number
  /** Lateral offset from centerline (ft): + right / − left. From offsetFromCL_ft. */
  offset_ft?: number
  clearance?: string
  role?: string
  /** Ticket display label (GAS / WATER) */
  label?: string
  ticketText?: string
  id?: string
  crossesCL?: boolean
}

export type ProfilePlan = {
  length_ft: number
  targetDepth_ft: number
  gradeWindow_deg: number
  exitBullseye_m: number
  /** Hold-grade station band (fraction of length) */
  holdStartFrac: number
  holdEndFrac: number
  climbStartFrac: number
  apwa: ApwaMark[]
  /** Curved road ROW samples (arc-length stationed) */
  centerline: CenterlineSample[]
  /** APWA paint blobs on ground / road */
  groundLocates: GroundLocate[]
  /** Geometry tag for HUD */
  geometry: 'curved_road_row' | 'straight'
}

function normalizeRawApwa(raw: unknown): ApwaMark | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  // Bot 5 ticket fields OR legacy school apwa fields
  const color = String(m.apwa ?? m.color ?? 'yellow')
  const type = String(m.type ?? 'utility')
  const depth_ft = Number(m.depth_ft ?? 4)
  const sta_ft = m.sta_ft != null ? Number(m.sta_ft) : undefined
  const offsetRaw =
    m.offsetFromCL_ft != null
      ? Number(m.offsetFromCL_ft)
      : m.offset_ft != null
        ? Number(m.offset_ft)
        : undefined
  const crossesCL =
    typeof m.crossesCL === 'boolean'
      ? m.crossesCL
      : m.role === 'parallel_brief_only'
        ? false
        : undefined
  const role =
    crossesCL === false
      ? 'parallel_brief_only'
      : m.role != null
        ? String(m.role)
        : undefined
  let clearance: string | undefined
  if (m.clearance != null) clearance = String(m.clearance)
  else if (typeof m.clearanceNote === 'string') {
    const n = m.clearanceNote.toLowerCase()
    if (n.includes('wide')) clearance = 'wide'
    else if (n.includes('tight')) clearance = 'tight'
  }
  return {
    color,
    type,
    depth_ft,
    sta_ft,
    offset_ft: offsetRaw,
    clearance,
    role,
    label: m.label != null ? String(m.label) : undefined,
    ticketText: m.ticketText != null ? String(m.ticketText) : undefined,
    id: m.id != null ? String(m.id) : undefined,
    crossesCL,
  }
}

export function planFromLevel(level: {
  id?: string
  bore?: {
    length_ft?: number
    targetDepth_ft?: number
    gradeWindow_deg?: number
    exitBullseye_m?: number
  }
  apwa?: unknown[]
  locateTickets?: unknown[]
}): ProfilePlan {
  const length_ft = level.bore?.length_ft ?? 120

  // S01: Bot 5 official tickets win over any stale school apwa
  let apwa: ApwaMark[]
  if (level.id === 'S01') {
    apwa = s01ApwaFromTickets()
  } else if (level.locateTickets?.length) {
    apwa = []
    for (const raw of level.locateTickets) {
      const mark = normalizeRawApwa(raw)
      if (mark) apwa.push(mark)
    }
  } else {
    apwa = []
    for (const raw of level.apwa ?? []) {
      const mark = normalizeRawApwa(raw)
      if (mark) apwa.push(mark)
    }
  }

  const planBase: ProfilePlan = {
    length_ft,
    targetDepth_ft: level.bore?.targetDepth_ft ?? 6,
    gradeWindow_deg: level.bore?.gradeWindow_deg ?? 1.5,
    exitBullseye_m: level.bore?.exitBullseye_m ?? 0.6,
    holdStartFrac: 0.18,
    holdEndFrac: 0.72,
    climbStartFrac: 0.78,
    apwa,
    centerline: [],
    groundLocates: [],
    geometry: 'curved_road_row',
  }
  planBase.centerline = sampleCenterline(length_ft, 80)
  planBase.groundLocates = groundLocatesFromPlan(planBase, planBase.centerline)
  return planBase
}

/** Ideal cover depth along station for teaching overlay (not force). */
export function idealDepthAtSta(plan: ProfilePlan, sta_ft: number): number {
  const L = plan.length_ft
  const t = plan.targetDepth_ft
  const u = Math.max(0, Math.min(1, sta_ft / L))
  if (u < plan.holdStartFrac) {
    // Entry dive
    const k = u / plan.holdStartFrac
    return t * smoothstep(k)
  }
  if (u < plan.climbStartFrac) {
    return t
  }
  // Climb to daylight
  const k = (u - plan.climbStartFrac) / (1 - plan.climbStartFrac)
  return t * (1 - smoothstep(k))
}

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

export function isInHoldBand(plan: ProfilePlan, sta_ft: number): boolean {
  const u = sta_ft / plan.length_ft
  return u >= plan.holdStartFrac && u <= plan.holdEndFrac
}

export function nearDaylight(
  plan: ProfilePlan,
  sta_ft: number,
  depth_ft: number,
): boolean {
  const u = sta_ft / plan.length_ft
  const bullseyeFt = plan.exitBullseye_m * M_TO_FT
  return u >= 0.92 && depth_ft <= Math.max(1.2, bullseyeFt * 0.5)
}

export type { CenterlineSample, GroundLocate }

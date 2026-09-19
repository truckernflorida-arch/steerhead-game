/**
 * S01 profile geometry helpers — entry → hold → utilities → climb → daylight.
 * Units: feet for locator/HUD; meters internally where physics uses m.
 */
export const FT_TO_M = 0.3048
export const M_TO_FT = 1 / FT_TO_M

export type BorePoint = {
  /** Horizontal station along planned shot (ft) */
  sta_ft: number
  /** Cover depth below grade (ft), positive down */
  depth_ft: number
}

export type ApwaMark = {
  color: 'yellow' | 'blue' | string
  type: string
  depth_ft: number
  sta_ft?: number
  clearance?: string
  role?: string
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
}

export function planFromLevel(level: {
  bore?: {
    length_ft?: number
    targetDepth_ft?: number
    gradeWindow_deg?: number
    exitBullseye_m?: number
  }
  apwa?: unknown[]
}): ProfilePlan {
  const length_ft = level.bore?.length_ft ?? 120
  const apwa: ApwaMark[] = []
  for (const raw of level.apwa ?? []) {
    if (!raw || typeof raw !== 'object') continue
    const m = raw as Record<string, unknown>
    apwa.push({
      color: String(m.color ?? 'yellow'),
      type: String(m.type ?? 'utility'),
      depth_ft: Number(m.depth_ft ?? 4),
      sta_ft: m.sta_ft != null ? Number(m.sta_ft) : undefined,
      clearance: m.clearance != null ? String(m.clearance) : undefined,
      role: m.role != null ? String(m.role) : undefined,
    })
  }
  return {
    length_ft,
    targetDepth_ft: level.bore?.targetDepth_ft ?? 6,
    gradeWindow_deg: level.bore?.gradeWindow_deg ?? 1.5,
    exitBullseye_m: level.bore?.exitBullseye_m ?? 0.6,
    holdStartFrac: 0.18,
    holdEndFrac: 0.72,
    climbStartFrac: 0.78,
    apwa,
  }
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

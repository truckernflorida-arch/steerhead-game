/**
 * Utility strike check — live contact vs APWA marks on the profile.
 * Crossing utilities (gas/telecom with sta_ft): hit if head is too close in
 * station + depth. Parallel (water) hits if lateral drifts into the paint.
 * Clearance: OD/2 + ~18 in ≈ 1.5–2 ft hard envelope; "wide" softens slightly.
 */
import type { ApwaMark } from '../bore/profile'

export type UtilityContact = {
  /** True = binary strike (clears clean-pass / hard fail) */
  strike: boolean
  /** Utility type label when struck */
  utilityType?: string
  /** APWA color */
  color?: string
  /** Distance to nearest utility envelope (ft), if any */
  nearestFt?: number
}

const STA_HIT_FT = 4.0
const DEPTH_HIT_FT = 1.35
const LAT_PARALLEL_FT = 8
const LAT_HIT_FT = 2.25

function clearanceScale(clearance?: string): number {
  if (clearance === 'tight') return 0.75
  if (clearance === 'wide') return 1.15
  return 1
}

/** Check head vs APWA utilities for a hard strike. */
export function checkUtilityStrike(opts: {
  station_ft: number
  coverDepth_ft: number
  lateral_ft: number
  apwa: ApwaMark[]
}): UtilityContact {
  let nearestFt = Infinity
  let hit: UtilityContact | null = null

  for (const m of opts.apwa) {
    const scale = clearanceScale(m.clearance)
    const depthHit = DEPTH_HIT_FT * scale
    const staHit = STA_HIT_FT * scale

    if (m.role === 'parallel_brief_only') {
      // Parallel utility along road shoulder (~+8 ft lateral)
      const dLat = Math.abs(opts.lateral_ft - LAT_PARALLEL_FT)
      const dDepth = Math.abs(opts.coverDepth_ft - m.depth_ft)
      const dist = Math.hypot(dLat, dDepth)
      nearestFt = Math.min(nearestFt, dist)
      if (dLat < LAT_HIT_FT * scale && dDepth < depthHit) {
        hit = {
          strike: true,
          utilityType: m.type,
          color: String(m.color),
          nearestFt: dist,
        }
        break
      }
      continue
    }

    const sta = m.sta_ft
    if (sta == null || !Number.isFinite(sta)) continue
    const dSta = Math.abs(opts.station_ft - sta)
    const dDepth = Math.abs(opts.coverDepth_ft - m.depth_ft)
    const dist = Math.hypot(dSta * 0.35, dDepth)
    nearestFt = Math.min(nearestFt, dist)
    if (dSta < staHit && dDepth < depthHit) {
      hit = {
        strike: true,
        utilityType: m.type,
        color: String(m.color),
        nearestFt: dist,
      }
      break
    }
  }

  if (hit) return hit
  return {
    strike: false,
    nearestFt: Number.isFinite(nearestFt) ? nearestFt : undefined,
  }
}

/** @deprecated Prefer checkUtilityStrike — kept for older call sites */
export function checkUtilityClearance(_opts?: {
  odIn?: number
  clearanceIn?: number
}): UtilityContact {
  return { strike: false }
}

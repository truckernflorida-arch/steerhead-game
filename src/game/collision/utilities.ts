/**
 * Utility strike check — live contact vs APWA marks on the profile.
 * Crossing utilities (gas with sta_ft / crossesCL): hit if head is too close in
 * station + depth + lateral.
 * Parallel (water, crossesCL false): hits only if lateral drifts into the paint
 * at the ticket offset (Bot 5: −8 LEFT).
 * Clearance: OD/2 + ~18 in ≈ 1.5–2 ft hard envelope; "wide" softens slightly.
 */
import type { ApwaMark } from '../bore/profile'

export type UtilityContact = {
  /** True = binary strike (clears clean-pass / hard fail) */
  strike: boolean
  /** Soft warn when closing on a locate envelope (not yet struck) */
  closing?: boolean
  /** Utility type label when struck / closing */
  utilityType?: string
  /** APWA color */
  color?: string
  /** Distance to nearest utility envelope (ft), if any */
  nearestFt?: number
  /** Suggested L/R to clear the nearest closing hazard */
  clearCue?: 'left' | 'right'
}

const STA_HIT_FT = 4.0
const DEPTH_HIT_FT = 1.35
const LAT_HIT_FT = 2.25
/** Soft warn when inside this multiple of the hard envelope */
const CLOSE_WARN_SCALE = 1.55

function clearanceScale(clearance?: string): number {
  if (clearance === 'tight') return 0.75
  if (clearance === 'wide') return 1.15
  return 1
}

/** Check head vs APWA utilities for a hard strike + soft closing warn. */
export function checkUtilityStrike(opts: {
  station_ft: number
  coverDepth_ft: number
  lateral_ft: number
  apwa: ApwaMark[]
}): UtilityContact {
  let nearestFt = Infinity
  let hit: UtilityContact | null = null
  let closing: UtilityContact | null = null

  for (const m of opts.apwa) {
    const scale = clearanceScale(m.clearance)
    const depthHit = DEPTH_HIT_FT * scale
    const staHit = STA_HIT_FT * scale
    const latHit = LAT_HIT_FT * scale

    if (m.role === 'parallel_brief_only' || m.crossesCL === false) {
      // Parallel utility at ticket offset (Bot 5 water: offsetFromCL_ft −8)
      const markLat = m.offset_ft ?? -8
      const dLat = Math.abs(opts.lateral_ft - markLat)
      const dDepth = Math.abs(opts.coverDepth_ft - m.depth_ft)
      const dist = Math.hypot(dLat, dDepth)
      nearestFt = Math.min(nearestFt, dist)
      if (dLat < latHit && dDepth < depthHit) {
        hit = {
          strike: true,
          utilityType: m.type,
          color: String(m.color),
          nearestFt: dist,
        }
        break
      }
      if (
        !closing &&
        dLat < latHit * CLOSE_WARN_SCALE &&
        dDepth < depthHit * CLOSE_WARN_SCALE
      ) {
        closing = {
          strike: false,
          closing: true,
          utilityType: m.type,
          color: String(m.color),
          nearestFt: dist,
          clearCue: opts.lateral_ft > markLat ? 'left' : 'right',
        }
      }
      continue
    }

    const sta = m.sta_ft
    if (sta == null || !Number.isFinite(sta)) continue
    const markLat = m.offset_ft ?? 0
    const dSta = Math.abs(opts.station_ft - sta)
    const dDepth = Math.abs(opts.coverDepth_ft - m.depth_ft)
    const dLat = Math.abs(opts.lateral_ft - markLat)
    const dist = Math.hypot(dSta * 0.35, dDepth, dLat * 0.85)
    nearestFt = Math.min(nearestFt, dist)

    if (dSta < staHit && dDepth < depthHit && dLat < latHit) {
      hit = {
        strike: true,
        utilityType: m.type,
        color: String(m.color),
        nearestFt: dist,
      }
      break
    }

    // Soft warn: approaching in station and already in depth/lateral danger band
    if (
      !closing &&
      dSta < staHit * CLOSE_WARN_SCALE &&
      dDepth < depthHit * CLOSE_WARN_SCALE &&
      dLat < latHit * CLOSE_WARN_SCALE
    ) {
      const clearCue: 'left' | 'right' =
        opts.lateral_ft > markLat ? 'left' : 'right'
      closing = {
        strike: false,
        closing: true,
        utilityType: m.type,
        color: String(m.color),
        nearestFt: dist,
        clearCue,
      }
    }
  }

  if (hit) return hit
  if (closing) {
    return {
      ...closing,
      nearestFt: Number.isFinite(nearestFt) ? nearestFt : closing.nearestFt,
    }
  }
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

/**
 * Curved road ROW centerline + ground APWA locates (plan view).
 * Station is arc-length along the curve (ft).
 * Parallel locates use offset_ft from tickets (Bot 5: water −8 LEFT).
 */
import type { ApwaMark, ProfilePlan } from './profile'

export type CenterlineSample = {
  sta_ft: number
  /** Plan easting (ft) */
  x_ft: number
  /** Plan northing (ft) */
  y_ft: number
  /** Tangent heading deg (0 = +X / east) */
  headingDeg: number
}

export type GroundLocate = {
  color: string
  type: string
  depth_ft: number
  sta_ft?: number
  x_ft: number
  y_ft: number
  /** Paint blob radius on ground (ft) */
  paintRadius_ft: number
  role?: string
  label: string
  /** Ticket display name e.g. GAS / WATER */
  ticketLabel?: string
  offset_ft?: number
  crossesCL?: boolean
}

/** Soft S-curve road ROW — not a straight side-profile only. */
export function sampleCenterline(
  length_ft: number,
  steps = 80,
): CenterlineSample[] {
  const out: CenterlineSample[] = []
  const n = Math.max(8, steps)
  let prevX = 0
  let prevY = 0
  let cum = 0
  for (let i = 0; i <= n; i++) {
    const u = i / n
    // Parametric road: advance + gentle lateral sweep (S-curve)
    const x = u * length_ft
    const y = Math.sin(u * Math.PI) * 18 // ±18 ft bow through middle
    if (i === 0) {
      out.push({ sta_ft: 0, x_ft: x, y_ft: y, headingDeg: 0 })
      prevX = x
      prevY = y
      continue
    }
    const dx = x - prevX
    const dy = y - prevY
    cum += Math.hypot(dx, dy)
    const headingDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    out.push({ sta_ft: cum, x_ft: x, y_ft: y, headingDeg })
    prevX = x
    prevY = y
  }
  // Re-normalize station to exact length_ft (arc was slightly longer)
  const arc = out[out.length - 1]?.sta_ft || length_ft
  if (arc > 1e-6) {
    for (const s of out) {
      s.sta_ft = (s.sta_ft / arc) * length_ft
    }
  }
  return out
}

export function centerlineAt(
  samples: CenterlineSample[],
  sta_ft: number,
): CenterlineSample {
  if (!samples.length) {
    return { sta_ft: 0, x_ft: 0, y_ft: 0, headingDeg: 0 }
  }
  const L = samples[samples.length - 1].sta_ft
  const t = Math.max(0, Math.min(L, sta_ft))
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]
    const b = samples[i]
    if (t <= b.sta_ft || i === samples.length - 1) {
      const span = Math.max(1e-6, b.sta_ft - a.sta_ft)
      const k = (t - a.sta_ft) / span
      return {
        sta_ft: t,
        x_ft: a.x_ft + (b.x_ft - a.x_ft) * k,
        y_ft: a.y_ft + (b.y_ft - a.y_ft) * k,
        headingDeg: a.headingDeg + shortestAngleDelta(a.headingDeg, b.headingDeg) * k,
      }
    }
  }
  return samples[samples.length - 1]
}

function shortestAngleDelta(from: number, to: number): number {
  let d = to - from
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

/** World offset from centerline using lateral (right = +). */
export function worldFromStation(
  samples: CenterlineSample[],
  sta_ft: number,
  lateral_ft: number,
): { x_ft: number; y_ft: number; headingDeg: number } {
  const c = centerlineAt(samples, sta_ft)
  const rad = (c.headingDeg * Math.PI) / 180
  // Right-hand normal
  const nx = Math.sin(rad)
  const ny = -Math.cos(rad)
  return {
    x_ft: c.x_ft + nx * lateral_ft,
    y_ft: c.y_ft + ny * lateral_ft,
    headingDeg: c.headingDeg,
  }
}

function ticketDisplayName(m: ApwaMark): string {
  if (m.label) return m.label.toUpperCase()
  return m.type.toUpperCase()
}

/** Paint APWA marks onto ground along / beside the curved ROW from tickets. */
export function groundLocatesFromPlan(
  plan: ProfilePlan,
  samples: CenterlineSample[],
): GroundLocate[] {
  const out: GroundLocate[] = []
  for (const m of plan.apwa) {
    const name = ticketDisplayName(m)
    const depth = m.depth_ft

    if (m.role === 'parallel_brief_only' || m.crossesCL === false) {
      // Parallel utility — paint at ticket offset (Bot 5 water: −8 LEFT)
      // Single primary ticket blob at sta_ft (or mid-bore) + light shoulder trail
      const offset = m.offset_ft ?? -8
      const primarySta = m.sta_ft ?? plan.length_ft * 0.5
      const sideLabel =
        Math.abs(offset) < 0.15
          ? 'on CL'
          : offset > 0
            ? `${offset.toFixed(0)} ft RIGHT`
            : `${Math.abs(offset).toFixed(0)} ft LEFT`

      const steps = 8
      for (let i = 0; i <= steps; i++) {
        const u = 0.15 + (0.75 * i) / steps
        const sta = plan.length_ft * u
        const w = worldFromStation(samples, sta, offset)
        const isPrimary = Math.abs(sta - primarySta) < plan.length_ft / steps
        out.push({
          color: m.color,
          type: m.type,
          depth_ft: depth,
          sta_ft: sta,
          x_ft: w.x_ft,
          y_ft: w.y_ft,
          paintRadius_ft: isPrimary ? 3.8 : 2.0,
          role: 'parallel_brief_only',
          label: `${name} · ${depth.toFixed(1)} ft · ${sideLabel}`,
          ticketLabel: name,
          offset_ft: offset,
          crossesCL: false,
        })
      }
      continue
    }

    const sta = m.sta_ft ?? plan.length_ft * 0.35
    const offset = m.offset_ft ?? 0
    const w = worldFromStation(samples, sta, offset)
    const sideLabel =
      Math.abs(offset) < 0.15
        ? 'on CL'
        : offset > 0
          ? `+${offset.toFixed(1)} ft R`
          : `${offset.toFixed(1)} ft L`
    out.push({
      color: m.color,
      type: m.type,
      depth_ft: depth,
      sta_ft: sta,
      x_ft: w.x_ft,
      y_ft: w.y_ft,
      paintRadius_ft: Math.abs(offset) > 0.5 ? 4.2 : 3.5,
      role: m.role,
      label: `${name} · ${depth.toFixed(1)} ft · ${sideLabel}`,
      ticketLabel: name,
      offset_ft: offset,
      crossesCL: m.crossesCL ?? true,
    })
  }
  return out
}

export function apwaColorHex(color: string): string {
  if (color === 'yellow') return '#e6c84a'
  if (color === 'blue') return '#4a9fe6'
  if (color === 'red') return '#e07070'
  if (color === 'orange') return '#e6a04a'
  if (color === 'green') return '#6dce8a'
  return '#aaa'
}

export type { ApwaMark }

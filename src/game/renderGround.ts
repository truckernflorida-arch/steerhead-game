/**
 * Walkover / ground locate map — what the crew actually works from.
 * Top-of-grade plan: paint marks + depth tickets from Bot 5 locate data.
 * Labels: GAS 3.5 ft / WATER 3.0 ft. No scenery fantasy — locates and offsets only.
 */
import type { GameState } from './state'
import { ROD_LENGTH_FT } from './state'
import { apwaColorHex, centerlineAt } from './bore/centerline'

export function renderGround(
  canvas: HTMLCanvasElement,
  state: GameState,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const plan = state.profile
  const cl = plan.centerline
  const pad = 28

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const s of cl) {
    minX = Math.min(minX, s.x_ft)
    maxX = Math.max(maxX, s.x_ft)
    minY = Math.min(minY, s.y_ft)
    maxY = Math.max(maxY, s.y_ft)
  }
  for (const g of plan.groundLocates) {
    minX = Math.min(minX, g.x_ft)
    maxX = Math.max(maxX, g.x_ft)
    minY = Math.min(minY, g.y_ft)
    maxY = Math.max(maxY, g.y_ft)
  }
  minX -= 14
  maxX += 14
  minY -= 16
  maxY += 16
  const spanX = Math.max(40, maxX - minX)
  const spanY = Math.max(30, maxY - minY)
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2 - 36) / spanY)

  const sx = (x: number) => pad + (x - minX) * scale
  const sy = (y: number) => h - pad - 28 - (y - minY) * scale

  // Grade (dirt/grass) — flat top-of-ground, not a 3D cutaway
  ctx.fillStyle = '#2f3d2a'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(70, 90, 55, 0.35)'
  for (let i = 0; i < 40; i++) {
    const gx = (i * 97) % w
    const gy = (i * 53) % (h - 40)
    ctx.fillRect(gx, gy, 18, 10)
  }

  // Planned centerline (bore path on paper)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(200, 210, 220, 0.55)'
  ctx.lineWidth = Math.max(2, 2.5 * scale)
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  cl.forEach((s, i) => {
    if (i === 0) ctx.moveTo(sx(s.x_ft), sy(s.y_ft))
    else ctx.lineTo(sx(s.x_ft), sy(s.y_ft))
  })
  ctx.stroke()
  ctx.setLineDash([])

  // LEFT / RIGHT of CL (facing daylight)
  const mid = centerlineAt(cl, plan.length_ft * 0.45)
  const rad = (mid.headingDeg * Math.PI) / 180
  const rx = Math.sin(rad) * 11
  const ry = -Math.cos(rad) * 11
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillStyle = '#8ecfff'
  ctx.fillText('LEFT', sx(mid.x_ft - rx) - 18, sy(mid.y_ft - ry))
  ctx.fillStyle = '#ffb08e'
  ctx.fillText('RIGHT', sx(mid.x_ft + rx) - 10, sy(mid.y_ft + ry))

  // Rod ticks
  const rodLen = state.rodLength_ft || ROD_LENGTH_FT
  ctx.fillStyle = '#9aa89a'
  ctx.font = '9px ui-monospace, monospace'
  for (let r = 0; r <= state.rodTotal; r++) {
    const sta = Math.min(plan.length_ft, r * rodLen)
    const c = centerlineAt(cl, sta)
    const x = sx(c.x_ft)
    const y = sy(c.y_ft)
    ctx.strokeStyle = '#6a7a6a'
    ctx.beginPath()
    ctx.moveTo(x - 5, y)
    ctx.lineTo(x + 5, y)
    ctx.stroke()
    if (r > 0 && r < state.rodTotal) ctx.fillText(`R${r}`, x + 6, y - 4)
  }

  // APWA paint + DEPTH TICKETS (Bot 5: GAS 3.5 ft / WATER 3.0 ft)
  const labeled = new Set<string>()
  for (const g of plan.groundLocates) {
    const color = apwaColorHex(g.color)
    const isParallel = g.role === 'parallel_brief_only' || g.crossesCL === false
    const isPrimary =
      !isParallel || (g.paintRadius_ft != null && g.paintRadius_ft >= 3.5)
    const r = Math.max(
      isPrimary ? 6 : 3.5,
      (g.paintRadius_ft || 3.5) * scale * (isPrimary ? 0.9 : 0.55),
    )
    const x = sx(g.x_ft)
    const y = sy(g.y_ft)
    ctx.fillStyle = color
    ctx.globalAlpha = isPrimary ? 0.92 : 0.55
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    if (isPrimary) {
      ctx.strokeStyle = '#0a1008'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // One depth-ticket label per utility type
    const key = g.ticketLabel || g.type
    if (!isPrimary || labeled.has(key)) continue
    labeled.add(key)

    const depth = Number(g.depth_ft ?? 0)
    const name = (g.ticketLabel || g.type || 'UTIL').toUpperCase()
    const offset = g.offset_ft ?? 0
    const side =
      Math.abs(offset) < 0.15
        ? 'on CL'
        : offset > 0
          ? `${offset.toFixed(0)} ft RIGHT`
          : `${Math.abs(offset).toFixed(0)} ft LEFT`

    ctx.fillStyle = '#f2f6f0'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText(name, x + r + 4, y - 8)
    ctx.fillStyle = color
    ctx.font = 'bold 15px ui-monospace, monospace'
    ctx.fillText(`${depth.toFixed(1)} ft`, x + r + 4, y + 10)
    ctx.fillStyle = '#d0d8d0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText(side, x + r + 4, y + 24)
  }

  // Drilled path on grade (as-built track)
  if (state.path.length > 1) {
    ctx.strokeStyle = '#e8c36a'
    ctx.lineWidth = 3
    ctx.beginPath()
    state.path.forEach((pt, i) => {
      const x = pt.x_ft ?? centerlineAt(cl, pt.sta_ft).x_ft
      const y = pt.y_ft ?? centerlineAt(cl, pt.sta_ft).y_ft
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    })
    ctx.stroke()
  }

  // Head under grade (projected)
  const hx = sx(state.worldX_ft)
  const hy = sy(state.worldY_ft)
  const lat = state.lateral_ft ?? 0
  ctx.fillStyle = '#e8c36a'
  ctx.beginPath()
  ctx.arc(hx, hy, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5ec8c8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(hx, hy, 12, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#fff6d0'
  ctx.font = 'bold 11px system-ui, sans-serif'
  const lr =
    Math.abs(lat) < 0.15
      ? 'ON CL'
      : lat > 0
        ? `${lat.toFixed(1)} ft RIGHT`
        : `${Math.abs(lat).toFixed(1)} ft LEFT`
  ctx.fillText(`HEAD · ${lr}`, hx + 14, hy - 10)

  // Locator puck on grade — ahead of head along CL (walkover progress)
  const locateSta = Math.min(
    plan.length_ft,
    state.station_ft + Math.max(8, rodLen * 0.6),
  )
  const loc = centerlineAt(cl, locateSta)
  const lx = sx(loc.x_ft)
  const ly = sy(loc.y_ft)
  ctx.fillStyle = '#1a2430'
  ctx.beginPath()
  ctx.arc(lx, ly, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5ec8c8'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#5ec8c8'
  ctx.beginPath()
  ctx.arc(lx, ly, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#b8f0f0'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('LOCATOR', lx - 24, ly - 16)
  ctx.fillStyle = '#9fb3c3'
  ctx.font = '10px ui-monospace, monospace'
  ctx.fillText(`walkover · sta ${locateSta.toFixed(0)}`, lx - 34, ly + 22)

  // Entry / daylight
  const entry = centerlineAt(cl, 2)
  const day = centerlineAt(cl, plan.length_ft * 0.95)
  ctx.fillStyle = '#5ec8c8'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('ENTRY', sx(entry.x_ft) - 10, sy(entry.y_ft) - 14)
  ctx.fillText('DAYLIGHT', sx(day.x_ft) - 24, sy(day.y_ft) - 14)

  ctx.fillStyle = '#c5d4c0'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText(
    `WALKOVER  Rod ${state.rodIndex}/${state.rodTotal}  sta ${state.station_ft.toFixed(0)} ft  · depth tickets · head L/R of CL`,
    pad,
    h - 10,
  )
}

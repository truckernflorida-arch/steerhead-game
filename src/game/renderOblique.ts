/**
 * Oblique / 3D-ish locator map — curved ROW + L/R walk + utilities.
 * Canvas 2.5D; dark teal HUD to match profile.
 */
import type { GameState } from './state'
import { ROD_LENGTH_FT } from './state'
import { idealDepthAtSta } from './bore/profile'
import { apwaColorHex, centerlineAt } from './bore/centerline'

function project(
  x_ft: number,
  y_ft: number,
  depth: number,
  originX: number,
  originY: number,
  scaleX: number,
  scaleY: number,
  scaleDepth: number,
): { x: number; y: number } {
  // Oblique: X along road easting, Y northing foreshortened + depth down
  const x = originX + x_ft * scaleX + y_ft * scaleY * 0.45
  const y = originY + depth * scaleDepth - y_ft * scaleY * 0.55
  return { x, y }
}

export function renderOblique(
  canvas: HTMLCanvasElement,
  state: GameState,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const plan = state.profile
  const cl = plan.centerline
  const padL = 40
  const padR = 24
  const padT = 32
  const padB = 32
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  let minX = 0
  let maxX = plan.length_ft
  let minY = -20
  let maxY = 20
  for (const s of cl) {
    minX = Math.min(minX, s.x_ft)
    maxX = Math.max(maxX, s.x_ft)
    minY = Math.min(minY, s.y_ft)
    maxY = Math.max(maxY, s.y_ft)
  }
  const spanX = Math.max(40, maxX - minX + 16)
  const spanY = Math.max(28, maxY - minY + 16)
  const scaleX = plotW / spanX
  const scaleY = plotW / (spanY * 2.2)
  const scaleDepth = plotH / 14
  const originX = padL - minX * scaleX + 8
  const originY = padT + 10

  ctx.fillStyle = '#12181f'
  ctx.fillRect(0, 0, w, h)

  // Grid
  ctx.strokeStyle = '#1e2a34'
  ctx.lineWidth = 1
  for (let gx = Math.floor(minX / 20) * 20; gx <= maxX + 20; gx += 20) {
    const a = project(gx, minY, 0, originX, originY, scaleX, scaleY, scaleDepth)
    const b = project(gx, maxY, 0, originX, originY, scaleX, scaleY, scaleDepth)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // Curved centerline at grade
  ctx.strokeStyle = 'rgba(94, 200, 200, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  cl.forEach((s, i) => {
    const p = project(s.x_ft, s.y_ft, 0, originX, originY, scaleX, scaleY, scaleDepth)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
  ctx.stroke()

  // Ideal depth guide along curve
  ctx.strokeStyle = 'rgba(94, 200, 200, 0.3)'
  ctx.setLineDash([5, 4])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i < cl.length; i++) {
    const s = cl[i]
    const d = idealDepthAtSta(plan, s.sta_ft)
    const p = project(s.x_ft, s.y_ft, d, originX, originY, scaleX, scaleY, scaleDepth)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Rod ticks
  const rodLen = state.rodLength_ft || ROD_LENGTH_FT
  ctx.fillStyle = '#6b7c88'
  ctx.font = '8px ui-monospace, monospace'
  for (let r = 1; r < state.rodTotal; r++) {
    const sta = r * rodLen
    if (sta >= plan.length_ft) break
    const c = centerlineAt(cl, sta)
    const p = project(c.x_ft, c.y_ft, 0, originX, originY, scaleX, scaleY, scaleDepth)
    ctx.fillText(`R${r + 1}`, p.x + 2, p.y - 4)
  }

  ctx.fillStyle = '#5ec8c8'
  ctx.font = 'bold 11px system-ui, sans-serif'
  const entry = centerlineAt(cl, 2)
  const ep = project(entry.x_ft, entry.y_ft, 0.5, originX, originY, scaleX, scaleY, scaleDepth)
  ctx.fillText('ENTRY', ep.x, ep.y - 10)
  const day = centerlineAt(cl, plan.length_ft * 0.92)
  const dp = project(day.x_ft, day.y_ft, 0.4, originX, originY, scaleX, scaleY, scaleDepth)
  ctx.fillText('DAYLIGHT', dp.x - 20, dp.y - 10)

  ctx.fillStyle = '#9fb3c3'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('← L (9)   curved ROW   R (3) →', padL, padT - 12)

  // Utilities
  for (const mark of plan.apwa) {
    const color = apwaColorHex(mark.color)
    if (mark.role === 'parallel_brief_only') {
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.75
      ctx.beginPath()
      for (let i = 0; i < cl.length; i++) {
        const s = cl[i]
        if (s.sta_ft < plan.length_ft * 0.15 || s.sta_ft > plan.length_ft * 0.9)
          continue
        const rad = (s.headingDeg * Math.PI) / 180
        const nx = Math.sin(rad) * 8
        const ny = -Math.cos(rad) * 8
        const p = project(
          s.x_ft + nx,
          s.y_ft + ny,
          mark.depth_ft,
          originX,
          originY,
          scaleX,
          scaleY,
          scaleDepth,
        )
        if (i === 0 || s.sta_ft <= plan.length_ft * 0.15 + 1) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = color
      ctx.font = '9px system-ui'
      const mid = centerlineAt(cl, plan.length_ft * 0.4)
      const mp = project(mid.x_ft + 8, mid.y_ft, mark.depth_ft, originX, originY, scaleX, scaleY, scaleDepth)
      ctx.fillText('WATER (parallel)', mp.x, mp.y - 6)
      continue
    }
    const sta = mark.sta_ft ?? plan.length_ft * 0.35
    const c = centerlineAt(cl, sta)
    const p = project(c.x_ft, c.y_ft, mark.depth_ft, originX, originY, scaleX, scaleY, scaleDepth)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '9px system-ui'
    ctx.fillText(mark.type.toUpperCase(), p.x + 10, p.y + 3)
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.4
    ctx.setLineDash([3, 3])
    ctx.strokeRect(p.x - 14, p.y - 10, 28, 20)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  // Path
  if (state.path.length > 1) {
    ctx.strokeStyle = '#c4a35a'
    ctx.lineWidth = 3
    ctx.beginPath()
    state.path.forEach((pt, i) => {
      const x = pt.x_ft ?? centerlineAt(cl, pt.sta_ft).x_ft
      const y = pt.y_ft ?? centerlineAt(cl, pt.sta_ft).y_ft
      const p = project(x, y, pt.depth_ft, originX, originY, scaleX, scaleY, scaleDepth)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()
  }

  const head = project(
    state.worldX_ft,
    state.worldY_ft,
    state.coverDepth_ft,
    originX,
    originY,
    scaleX,
    scaleY,
    scaleDepth,
  )
  ctx.fillStyle = '#e8c36a'
  ctx.beginPath()
  ctx.arc(head.x, head.y, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5ec8c8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(head.x, head.y, 11, 0, Math.PI * 2)
  ctx.stroke()

  if (Math.abs(state.lateral_ft) > 0.15) {
    ctx.fillStyle = state.lateral_ft > 0 ? '#4a9fe6' : '#e6c84a'
    ctx.font = 'bold 11px system-ui'
    const side = state.lateral_ft > 0 ? 'RIGHT' : 'LEFT'
    ctx.fillText(
      `${side} ${Math.abs(state.lateral_ft).toFixed(1)} ft`,
      head.x + 14,
      head.y - 12,
    )
  }

  ctx.fillStyle = '#9fb3c3'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText(
    `OBLIQUE  Rod ${state.rodIndex}/${state.rodTotal}  sta ${state.station_ft.toFixed(0)}  L/R ${state.lateral_ft >= 0 ? '+' : ''}${state.lateral_ft.toFixed(1)}  depth ${state.coverDepth_ft.toFixed(1)}`,
    padL,
    h - 10,
  )
}

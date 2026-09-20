/**
 * Oblique / top-ish locator map — left–right (walk/yaw) teaching view.
 * Canvas 2.5D; dark teal HUD to match profile.
 */
import type { GameState } from './state'
import { idealDepthAtSta } from './bore/profile'

function project(
  sta: number,
  lat: number,
  depth: number,
  originX: number,
  originY: number,
  scaleSta: number,
  scaleLat: number,
  scaleDepth: number,
): { x: number; y: number } {
  const x = originX + sta * scaleSta + lat * scaleLat * 0.55
  const y = originY + depth * scaleDepth - lat * scaleLat * 0.35
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
  const padL = 56
  const padR = 28
  const padT = 36
  const padB = 36
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const scaleSta = plotW / plan.length_ft
  const scaleLat = plotW / 48
  const scaleDepth = plotH / 14
  const originX = padL
  const originY = padT + 8

  ctx.fillStyle = '#12181f'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = '#1e2a34'
  ctx.lineWidth = 1
  for (let s = 0; s <= plan.length_ft; s += 20) {
    const a = project(s, -12, 0, originX, originY, scaleSta, scaleLat, scaleDepth)
    const b = project(s, 12, 0, originX, originY, scaleSta, scaleLat, scaleDepth)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  for (let lat = -12; lat <= 12; lat += 4) {
    const a = project(0, lat, 0, originX, originY, scaleSta, scaleLat, scaleDepth)
    const b = project(
      plan.length_ft,
      lat,
      0,
      originX,
      originY,
      scaleSta,
      scaleLat,
      scaleDepth,
    )
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(94, 200, 200, 0.35)'
  ctx.setLineDash([5, 4])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let s = 0; s <= plan.length_ft; s += 2) {
    const d = idealDepthAtSta(plan, s)
    const p = project(s, 0, d, originX, originY, scaleSta, scaleLat, scaleDepth)
    if (s === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#5ec8c8'
  ctx.font = 'bold 11px system-ui, sans-serif'
  const entry = project(2, 0, 0.5, originX, originY, scaleSta, scaleLat, scaleDepth)
  ctx.fillText('ENTRY', entry.x, entry.y - 10)
  const day = project(
    plan.length_ft * 0.92,
    0,
    0.4,
    originX,
    originY,
    scaleSta,
    scaleLat,
    scaleDepth,
  )
  ctx.fillText('DAYLIGHT', day.x - 20, day.y - 10)

  ctx.fillStyle = '#9fb3c3'
  ctx.font = 'bold 12px system-ui, sans-serif'
  const leftLab = project(
    plan.length_ft * 0.5,
    -10,
    0,
    originX,
    originY,
    scaleSta,
    scaleLat,
    scaleDepth,
  )
  const rightLab = project(
    plan.length_ft * 0.5,
    10,
    0,
    originX,
    originY,
    scaleSta,
    scaleLat,
    scaleDepth,
  )
  ctx.fillText('← LEFT (9)', leftLab.x - 36, leftLab.y)
  ctx.fillText('RIGHT (3) →', rightLab.x - 10, rightLab.y)

  for (const mark of plan.apwa) {
    const color =
      mark.color === 'yellow'
        ? '#e6c84a'
        : mark.color === 'blue'
          ? '#4a9fe6'
          : '#aaa'
    const sta = mark.sta_ft ?? plan.length_ft * 0.35
    const depth = mark.depth_ft
    if (mark.role === 'parallel_brief_only') {
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.85
      const a = project(
        plan.length_ft * 0.15,
        8,
        depth,
        originX,
        originY,
        scaleSta,
        scaleLat,
        scaleDepth,
      )
      const b = project(
        plan.length_ft * 0.9,
        8,
        depth,
        originX,
        originY,
        scaleSta,
        scaleLat,
        scaleDepth,
      )
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = color
      ctx.font = '9px system-ui'
      ctx.fillText('WATER (parallel)', a.x, a.y - 6)
      continue
    }
    const p = project(sta, 0, depth, originX, originY, scaleSta, scaleLat, scaleDepth)
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

  if (state.path.length > 1) {
    ctx.strokeStyle = '#c4a35a'
    ctx.lineWidth = 3
    ctx.beginPath()
    state.path.forEach((pt, i) => {
      const p = project(
        pt.sta_ft,
        pt.offset_ft ?? 0,
        pt.depth_ft,
        originX,
        originY,
        scaleSta,
        scaleLat,
        scaleDepth,
      )
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()
  }

  const head = project(
    state.station_ft,
    state.lateral_ft,
    state.coverDepth_ft,
    originX,
    originY,
    scaleSta,
    scaleLat,
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
    `LOCATOR MAP  sta ${state.station_ft.toFixed(0)} ft  L/R ${state.lateral_ft >= 0 ? '+' : ''}${state.lateral_ft.toFixed(1)} ft  depth ${state.coverDepth_ft.toFixed(1)} ft`,
    padL,
    h - 10,
  )
}

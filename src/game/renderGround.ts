/**
 * Ground locate map — curved road ROW + APWA paint on pavement + head.
 * Top-down plan view for crew fantasy: see locates where you must bore.
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

  // Bounds from centerline + locates
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
  minX -= 12
  maxX += 12
  minY -= 14
  maxY += 14
  const spanX = Math.max(40, maxX - minX)
  const spanY = Math.max(30, maxY - minY)
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2 - 18) / spanY)

  const sx = (x: number) => pad + (x - minX) * scale
  const sy = (y: number) => h - pad - 14 - (y - minY) * scale

  ctx.fillStyle = '#1a2228'
  ctx.fillRect(0, 0, w, h)

  // Road asphalt ribbon along centerline
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#2a3038'
  ctx.lineWidth = Math.max(10, 14 * scale)
  ctx.beginPath()
  cl.forEach((s, i) => {
    if (i === 0) ctx.moveTo(sx(s.x_ft), sy(s.y_ft))
    else ctx.lineTo(sx(s.x_ft), sy(s.y_ft))
  })
  ctx.stroke()

  // Lane stripe
  ctx.strokeStyle = '#c4b86a'
  ctx.lineWidth = Math.max(1, 1.5 * scale)
  ctx.setLineDash([8, 10])
  ctx.beginPath()
  cl.forEach((s, i) => {
    if (i === 0) ctx.moveTo(sx(s.x_ft), sy(s.y_ft))
    else ctx.lineTo(sx(s.x_ft), sy(s.y_ft))
  })
  ctx.stroke()
  ctx.setLineDash([])

  // ROW edge dashes
  ctx.strokeStyle = 'rgba(94, 200, 200, 0.35)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  for (const side of [-1, 1] as const) {
    ctx.beginPath()
    for (let i = 0; i < cl.length; i++) {
      const s = cl[i]
      const rad = (s.headingDeg * Math.PI) / 180
      const nx = Math.sin(rad) * side * 8
      const ny = -Math.cos(rad) * side * 8
      const x = sx(s.x_ft + nx)
      const y = sy(s.y_ft + ny)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.setLineDash([])

  // Rod station ticks along curve
  const rodLen = state.rodLength_ft || ROD_LENGTH_FT
  ctx.fillStyle = '#6b7c88'
  ctx.font = '9px ui-monospace, monospace'
  for (let r = 0; r <= state.rodTotal; r++) {
    const sta = Math.min(plan.length_ft, r * rodLen)
    const c = centerlineAt(cl, sta)
    const x = sx(c.x_ft)
    const y = sy(c.y_ft)
    ctx.strokeStyle = '#4a5864'
    ctx.beginPath()
    ctx.moveTo(x - 4, y)
    ctx.lineTo(x + 4, y)
    ctx.stroke()
    if (r > 0 && r < state.rodTotal) {
      ctx.fillText(`R${r}`, x + 5, y - 4)
    }
  }

  // Ground locates (paint blobs)
  for (const g of plan.groundLocates) {
    const color = apwaColorHex(g.color)
    const r = Math.max(4, g.paintRadius_ft * scale)
    ctx.fillStyle = color
    ctx.globalAlpha = g.role === 'parallel_brief_only' ? 0.45 : 0.85
    ctx.beginPath()
    ctx.arc(sx(g.x_ft), sy(g.y_ft), r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    if (g.role !== 'parallel_brief_only') {
      ctx.fillStyle = color
      ctx.font = 'bold 10px system-ui, sans-serif'
      const offsetMark = /ft [RL]/.test(g.label)
      ctx.fillText(
        offsetMark ? `${g.type.toUpperCase()} (offset)` : g.type.toUpperCase(),
        sx(g.x_ft) + r + 3,
        sy(g.y_ft) + 3,
      )
      if (offsetMark) {
        // Crosshair so offset paint is obvious vs on-ROW marks
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(sx(g.x_ft) - r - 4, sy(g.y_ft))
        ctx.lineTo(sx(g.x_ft) + r + 4, sy(g.y_ft))
        ctx.moveTo(sx(g.x_ft), sy(g.y_ft) - r - 4)
        ctx.lineTo(sx(g.x_ft), sy(g.y_ft) + r + 4)
        ctx.stroke()
      }
    }
  }

  // Bore path on ground
  if (state.path.length > 1) {
    ctx.strokeStyle = '#c4a35a'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    state.path.forEach((pt, i) => {
      const x = pt.x_ft ?? centerlineAt(cl, pt.sta_ft).x_ft
      const y = pt.y_ft ?? centerlineAt(cl, pt.sta_ft).y_ft
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    })
    ctx.stroke()
  }

  // Head
  const hx = sx(state.worldX_ft)
  const hy = sy(state.worldY_ft)
  ctx.fillStyle = '#e8c36a'
  ctx.beginPath()
  ctx.arc(hx, hy, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5ec8c8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(hx, hy, 11, 0, Math.PI * 2)
  ctx.stroke()

  // Entry / daylight labels
  const entry = centerlineAt(cl, 2)
  const day = centerlineAt(cl, plan.length_ft * 0.95)
  ctx.fillStyle = '#5ec8c8'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('ENTRY', sx(entry.x_ft) - 10, sy(entry.y_ft) - 14)
  ctx.fillText('DAYLIGHT', sx(day.x_ft) - 24, sy(day.y_ft) - 14)

  ctx.fillStyle = '#9fb3c3'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText(
    `GROUND LOCATE  Rod ${state.rodIndex}/${state.rodTotal}  sta ${state.station_ft.toFixed(0)} ft  curve ROW`,
    pad,
    h - 8,
  )
}

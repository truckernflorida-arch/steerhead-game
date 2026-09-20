/**
 * Profile bore view — entry → hold grade → utility envelopes → climb → daylight.
 * Concept: concepts/03-full-bore-sideview.png
 */
import type { GameState } from './state'
import { idealDepthAtSta } from './bore/profile'

export function render(canvas: HTMLCanvasElement, state: GameState): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const plan = state.profile
  const padL = 48
  const padR = 24
  const padT = 36
  const padB = 28
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const maxDepth = 12

  const xOf = (sta: number) => padL + (sta / plan.length_ft) * plotW
  const yOf = (depth: number) => padT + (depth / maxDepth) * plotH

  ctx.fillStyle = '#1a2330'
  ctx.fillRect(0, 0, w, padT)
  ctx.fillStyle = '#2a2118'
  ctx.fillRect(0, padT, w, h - padT)

  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#32261c' : '#2a2118'
    ctx.fillRect(padL, yOf(i * 2), plotW, yOf(2) - yOf(0))
  }

  ctx.strokeStyle = '#4a5a48'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(padL, padT)
  ctx.lineTo(padL + plotW, padT)
  ctx.stroke()
  ctx.setLineDash([])

  // Ideal grade guide
  ctx.strokeStyle = 'rgba(80, 200, 200, 0.35)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  for (let s = 0; s <= plan.length_ft; s += 2) {
    const d = idealDepthAtSta(plan, s)
    const x = xOf(s)
    const y = yOf(d)
    if (s === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#8a9aa6'
  ctx.font = '10px ui-monospace, monospace'
  for (const ft of [2, 4, 6, 10, 12]) {
    const y = yOf(ft)
    ctx.strokeStyle = '#3d4a54'
    ctx.beginPath()
    ctx.moveTo(padL - 4, y)
    ctx.lineTo(padL, y)
    ctx.stroke()
    ctx.fillText(`${ft} FT`, 4, y + 3)
  }

  ctx.fillStyle = '#5ec8c8'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('ENTRY', xOf(2), padT - 10)
  ctx.fillText('HOLD GRADE', xOf(plan.length_ft * 0.4), padT - 10)
  ctx.fillText('DAYLIGHT', xOf(plan.length_ft * 0.88), padT - 10)

  // 10 ft rod segment ticks on profile
  const rodLen = state.rodLength_ft || 10
  ctx.strokeStyle = 'rgba(94, 200, 200, 0.25)'
  ctx.lineWidth = 1
  ctx.fillStyle = '#5a6a74'
  ctx.font = '8px ui-monospace, monospace'
  for (let r = 1; r < state.rodTotal; r++) {
    const sta = r * rodLen
    if (sta >= plan.length_ft) break
    const x = xOf(sta)
    ctx.beginPath()
    ctx.moveTo(x, padT)
    ctx.lineTo(x, padT + plotH)
    ctx.stroke()
    ctx.fillText(`R${r + 1}`, x + 2, padT + 10)
  }

  for (const mark of plan.apwa) {
    const color =
      mark.color === 'yellow'
        ? '#e6c84a'
        : mark.color === 'blue'
          ? '#4a9fe6'
          : '#aaa'
    const sta = mark.sta_ft ?? plan.length_ft * 0.35
    const depth = mark.depth_ft
    const clearW = mark.clearance === 'wide' ? 14 : 8
    const clearH = mark.clearance === 'wide' ? 2.2 : 1.4

    if (mark.role === 'parallel_brief_only') {
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(xOf(plan.length_ft * 0.2), yOf(depth + 3))
      ctx.lineTo(xOf(plan.length_ft * 0.85), yOf(depth + 3))
      ctx.stroke()
      ctx.fillStyle = color
      ctx.font = '9px system-ui'
      ctx.fillText(
        `${mark.type.toUpperCase()}`,
        xOf(plan.length_ft * 0.22),
        yOf(depth + 3) - 6,
      )
      continue
    }

    ctx.strokeStyle = color
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeRect(
      xOf(sta) - clearW,
      yOf(depth - clearH / 2),
      clearW * 2,
      yOf(clearH) - yOf(0),
    )
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.fillStyle = color
    ctx.fillRect(xOf(sta) - 10, yOf(depth) - 3, 20, 6)
    ctx.font = '9px system-ui'
    ctx.fillText(mark.type.toUpperCase(), xOf(sta) - 10, yOf(depth) - 8)
  }

  const exitX = xOf(plan.length_ft * 0.95)
  ctx.strokeStyle = 'rgba(94, 200, 200, 0.6)'
  ctx.setLineDash([4, 3])
  ctx.strokeRect(exitX - 20, yOf(0), 40, yOf(1.5) - yOf(0))
  ctx.setLineDash([])

  if (state.path.length > 1) {
    ctx.strokeStyle = '#c4a35a'
    ctx.lineWidth = 3
    ctx.beginPath()
    state.path.forEach((p, i) => {
      const x = xOf(p.sta_ft)
      const y = yOf(p.depth_ft)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  const hx = xOf(state.station_ft)
  const hy = yOf(state.coverDepth_ft)
  const pitchRad = (state.pitchDeg * Math.PI) / 180
  ctx.fillStyle = '#e8c36a'
  ctx.beginPath()
  ctx.arc(hx, hy, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5ec8c8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(hx, hy)
  ctx.lineTo(hx + Math.cos(pitchRad) * 22, hy + Math.sin(pitchRad) * 22)
  ctx.stroke()

  ctx.fillStyle = '#9fb3c3'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText(
    `${state.levelId}  Rod ${state.rodIndex}/${state.rodTotal}  sta ${state.station_ft.toFixed(0)} ft  depth ${state.coverDepth_ft.toFixed(1)} ft  pitch ${state.pitchDeg.toFixed(1)}° → tgt ${state.targetPitchDeg.toFixed(1)}°`,
    padL,
    h - 8,
  )

  if (state.panicDoglegWarn && !state.taughtFail) {
    ctx.fillStyle = '#e6b84d'
    ctx.fillText('WARN: over-steer — ease bend rate', padL + 320, h - 8)
  } else if (state.outcome === 'daylight') {
    ctx.fillStyle = '#6dce8a'
    ctx.fillText('DAYLIGHT', padL + 320, h - 8)
  } else if (state.taughtFail) {
    ctx.fillStyle = '#e07070'
    ctx.fillText(String(state.taughtFail), padL + 320, h - 8)
  }
}

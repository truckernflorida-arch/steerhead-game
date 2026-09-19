/**
 * Canvas render — head depth / pitch / ROP so dirt feel is visible on /play.
 */
import type { GameState } from './state'
import { getLesson1Soil } from './env/soil'

export function render(canvas: HTMLCanvasElement, state: GameState): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const soil = getLesson1Soil()

  ctx.fillStyle = '#1a1f24'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#3d4a54'
  ctx.lineWidth = 2
  ctx.strokeRect(8, 8, w - 16, h - 16)

  // Bore path strip
  const pad = 40
  const y0 = h * 0.45
  ctx.strokeStyle = '#2a3540'
  ctx.beginPath()
  ctx.moveTo(pad, y0)
  ctx.lineTo(w - pad, y0)
  ctx.stroke()

  const progress = state.boreProgress
  const x = pad + progress * (w - pad * 2)
  const pitchRad = (state.pitchDeg * Math.PI) / 180
  const headY = y0 + Math.sin(pitchRad) * 80

  // Trail
  ctx.strokeStyle = '#5a7a4a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad, y0)
  ctx.lineTo(x, headY)
  ctx.stroke()

  // Head
  ctx.fillStyle = '#c4a35a'
  ctx.beginPath()
  ctx.arc(x, headY, 8, 0, Math.PI * 2)
  ctx.fill()

  // Pitch tick
  ctx.strokeStyle = '#e8c36a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, headY)
  ctx.lineTo(x + Math.cos(pitchRad) * 28, headY + Math.sin(pitchRad) * 28)
  ctx.stroke()

  const title = state.level?.title ?? state.levelId
  ctx.fillStyle = '#9fb3c3'
  ctx.font = '14px system-ui, sans-serif'
  ctx.fillText(`SteerHead · ${state.levelId} — ${title}`, 20, 32)
  ctx.fillText(
    `soil=${state.soilId}→${soil.fourPack}  unlocked=${String(soil.unlocked)}`,
    20,
    52,
  )

  ctx.fillStyle = '#c5d4e0'
  ctx.font = '13px ui-monospace, monospace'
  ctx.fillText(
    `depth=${state.headDepth_m.toFixed(2)} m  pitch=${state.pitchDeg.toFixed(2)}°  ROP=${state.rop_m_s.toFixed(3)} m/s`,
    20,
    76,
  )
  ctx.fillText(
    `thrustResponse=${soil.thrustResponse}  ROP band ${soil.ropRange_m_s[0]}–${soil.ropRange_m_s[1]}  maxSteer=${soil.maxSteerDegPerM}°/m`,
    20,
    96,
  )
  ctx.fillText(
    `steerAuth=${soil.steerAuthority}  walkBias=${soil.walkBias_deg_m}°/m  progress=${(progress * 100).toFixed(1)}%`,
    20,
    116,
  )

  ctx.fillStyle = '#6b7c88'
  ctx.fillText(
    `t=${state.t.toFixed(1)}s  phase=${state.phase}  gpm=${state.gpmNorm.toFixed(2)}`,
    20,
    h - 40,
  )

  if (state.panicDoglegWarn && !state.taughtFail) {
    ctx.fillStyle = '#e6b84d'
    ctx.fillText('WARN: over-steer — ease bend rate', 20, h - 20)
  } else if (state.taughtFail) {
    ctx.fillStyle = '#e07070'
    ctx.fillText(`taught-fail: ${state.taughtFail}`, 20, h - 20)
  } else {
    ctx.fillStyle = '#6b7c88'
    ctx.fillText(
      'WASD/arrows thrust+steer · slider=thrust · dirt feel (not stub)',
      20,
      h - 20,
    )
  }
}

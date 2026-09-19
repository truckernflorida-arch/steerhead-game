/**
 * Level scripts enable/disable plant failures — physics reads this; UI never does.
 * Aligns with school JSON `plantFail` strings (e.g. centrifugal@40%).
 */

export type PlantFailKind =
  | 'mixer'
  | 'centrifugal'
  | 'mudPump'
  | 'recycling'
  | 'none'

export type PlantFailScript = {
  /** From school card, e.g. "centrifugal@40%", "none", "mixer_wrong_inherit" */
  raw: string
  enabled: boolean
  kind: PlantFailKind
  /** 0–1 bore progress trigger when parsed from @NN% */
  atProgress?: number
  /** Extra tags from raw (wrong_inherit, relief_on_torque, …) */
  mods: string[]
}

const KIND_ALIASES: Record<string, PlantFailKind> = {
  mixer: 'mixer',
  centrifugal: 'centrifugal',
  mudpump: 'mudPump',
  mud_pump: 'mudPump',
  recycling: 'recycling',
  none: 'none',
}

/** Parse school `plantFail` into a script physics can arm. */
export function parsePlantFail(raw: string): PlantFailScript {
  const trimmed = (raw || 'none').trim()
  if (trimmed === 'none' || trimmed === 'none_if_circulated') {
    return {
      raw: trimmed,
      enabled: trimmed === 'none' ? false : true, // none_if_circulated = conditional arm
      kind: 'none',
      mods: trimmed === 'none_if_circulated' ? ['if_circulated'] : [],
    }
  }

  // e.g. centrifugal@40% | centrifugal_then_mudPump_cap@55% | mixer_wrong_inherit
  const atMatch = trimmed.match(/@(\d+(?:\.\d+)?)%?/)
  const atProgress = atMatch ? Number(atMatch[1]) / 100 : undefined
  const head = trimmed.replace(/@\d+(?:\.\d+)?%?/, '')
  const parts = head.split(/_then_|_/).filter(Boolean)

  let kind: PlantFailKind = 'none'
  for (const p of parts) {
    const k = KIND_ALIASES[p.toLowerCase()]
    if (k && k !== 'none') {
      kind = k
      break
    }
  }
  // centrifugal_then_mudPump… → primary centrifugal
  if (head.startsWith('centrifugal')) kind = 'centrifugal'
  if (head.startsWith('mixer')) kind = 'mixer'
  if (head.startsWith('mudPump') || head.startsWith('mud_pump')) kind = 'mudPump'
  if (head.startsWith('recycling')) kind = 'recycling'

  return {
    raw: trimmed,
    enabled: true,
    kind,
    atProgress,
    mods: parts.filter((p) => !KIND_ALIASES[p.toLowerCase()]),
  }
}

export type PlantFailRuntime = {
  script: PlantFailScript
  /** Level / designer kill switch */
  armed: boolean
  /** Set false to disable mid-run (debug, assist, or script `none`) */
  enabled: boolean
}

export function armPlantFail(raw: string, opts?: { armed?: boolean }): PlantFailRuntime {
  const script = parsePlantFail(raw)
  const armed = opts?.armed ?? true
  return {
    script,
    armed,
    enabled: armed && script.enabled && script.kind !== 'none',
  }
}

export function setPlantFailEnabled(rt: PlantFailRuntime, enabled: boolean): PlantFailRuntime {
  return { ...rt, enabled: enabled && rt.armed && rt.script.kind !== 'none' }
}

/**
 * Physics tick hook (sketch):
 *
 *   if (!rt.enabled) return // no plant failure injection
 *   if (rt.script.atProgress != null && boreProgress < rt.script.atProgress) return
 *   injectPlantFailure(rt.script.kind, rt.script.mods) // → may add TF_MIXER_DEAD etc. to causes[]
 *
 * UI never reads PlantFailRuntime — only TickSnap after physics runs.
 */

/** Example: S02 card → FC-01 cascade when progress crosses 40%. */
export const S02_PLANT_FAIL_EXAMPLE = armPlantFail('centrifugal@40%')

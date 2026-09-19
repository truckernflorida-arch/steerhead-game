/**
 * Dummy cascade emitter: TF_MIXER_DEAD → TF_PRESSURE_DROP → TF_PACK_OFF
 * Mimics FC-01 / Cascade A pressure path for HUD + debrief wiring tests.
 */
import { logCauseTransitions } from './causeLog'
import type { CauseLog, CauseSnap, TickSnap, VerbSnap } from './types'

const CAUSES: Record<string, CauseSnap> = {
  TF_MIXER_DEAD: {
    id: 'TF_MIXER_DEAD',
    label: 'Mixer / centrifugal quit — makeup volume dying',
    tag: 'FC-01',
  },
  TF_PRESSURE_DROP: {
    id: 'TF_PRESSURE_DROP',
    label: 'Annular pressure sagging with GPM',
    tag: 'cascade-A',
  },
  TF_PACK_OFF: {
    id: 'TF_PACK_OFF',
    label: 'Head packing — clay balling on a dry face',
    tag: 'cascade-A',
  },
}

/** Timeline (sim seconds) for the dummy chain. */
export const DUMMY_CASCADE_AT = {
  mixerDead: 2,
  pressureDrop: 5,
  packOff: 8,
} as const

function verbsFor(causes: CauseSnap[]): VerbSnap[] {
  const ids = new Set(causes.map((c) => c.id))
  const chips: VerbSnap[] = []

  if (ids.has('TF_MIXER_DEAD') || ids.has('TF_PRESSURE_DROP')) {
    chips.push({ id: 'RV_RESTORE_MIXER', label: 'Restore mixer', enabled: true })
    chips.push({ id: 'RV_CIRCULATE_NO_PUSH', label: 'Circulate (no push)', enabled: true })
  }
  if (ids.has('TF_PRESSURE_DROP') || ids.has('TF_PACK_OFF')) {
    chips.push({ id: 'RV_EASE_THRUST', label: 'Ease thrust', enabled: true })
    chips.push({ id: 'RV_JET_CLEAN', label: 'Jet / flush', enabled: true })
  }
  if (ids.has('TF_PACK_OFF')) {
    chips.push({ id: 'RV_HOLD_RPM', label: 'Hold RPM', enabled: true })
    chips.push({ id: 'RV_RECIPROCATE', label: 'Reciprocate', enabled: true })
  }
  // Dedupe by id, keep first
  const seen = new Set<string>()
  return chips.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
}

function symptomsFor(causes: CauseSnap[]) {
  const ids = new Set(causes.map((c) => c.id))
  const s: TickSnap['symptoms'] = []
  if (ids.has('TF_MIXER_DEAD')) {
    s.push({ id: 'mixer_dead', label: 'MIXER DEAD', severity: 'warn' })
  }
  if (ids.has('TF_PRESSURE_DROP')) {
    s.push({ id: 'pressure_drop', label: 'PSI SAG', severity: 'warn' })
  }
  if (ids.has('TF_PACK_OFF')) {
    s.push({ id: 'pack_off', label: 'HEAD PACKED', severity: 'critical' })
  }
  return s
}

function hudFor(t: number, causes: CauseSnap[]): TickSnap['hud'] {
  const ids = new Set(causes.map((c) => c.id))
  let gpm = 48
  let psi = 55
  let packOff = 0.05
  let mixerOn = true
  if (ids.has('TF_MIXER_DEAD')) {
    mixerOn = false
    gpm = Math.max(0, 48 - (t - DUMMY_CASCADE_AT.mixerDead) * 12)
  }
  if (ids.has('TF_PRESSURE_DROP')) {
    psi = Math.max(18, 55 - (t - DUMMY_CASCADE_AT.pressureDrop) * 8)
  }
  if (ids.has('TF_PACK_OFF')) {
    packOff = Math.min(1, 0.4 + (t - DUMMY_CASCADE_AT.packOff) * 0.15)
    gpm = Math.min(gpm, 8)
  }
  return {
    mudWeight: 8.6,
    viscosity: 30,
    pumpGpm: gpm,
    returns: gpm * 0.7,
    annularPsi: psi,
    pitchDeg: -2.5,
    packOff,
    cleanIndex: 72,
    tankVolume: mixerOn ? 80 : 40,
    mixerOn,
    sandPct: 2,
  }
}

export type DummyEmitterState = {
  causes: CauseSnap[]
  log: CauseLog
}

export function createDummyEmitter(): DummyEmitterState {
  return { causes: [], log: [] }
}

/** Advance dummy physics to sim time `t` (seconds). Returns TickSnap + mutates log. */
export function emitDummyTick(state: DummyEmitterState, t: number): TickSnap {
  const next: CauseSnap[] = []
  if (t >= DUMMY_CASCADE_AT.mixerDead) next.push(CAUSES.TF_MIXER_DEAD)
  if (t >= DUMMY_CASCADE_AT.pressureDrop) next.push(CAUSES.TF_PRESSURE_DROP)
  if (t >= DUMMY_CASCADE_AT.packOff) next.push(CAUSES.TF_PACK_OFF)

  state.log = logCauseTransitions(t, state.causes, next, state.log)
  state.causes = next

  return {
    t,
    phase: 'pilot',
    causes: next.slice(),
    verbs: verbsFor(next),
    symptoms: symptomsFor(next),
    hud: hudFor(t, next),
    flags: {
      taughtFail: t >= DUMMY_CASCADE_AT.packOff + 3 ? 'TF_PACKED_HEAD' : undefined,
    },
  }
}

/** Convenience: walk 0..12s at 1s steps for tests / storybook. */
export function runDummyCascadeDemo(): { snaps: TickSnap[]; log: CauseLog } {
  const state = createDummyEmitter()
  const snaps: TickSnap[] = []
  for (let t = 0; t <= 12; t += 1) {
    snaps.push(emitDummyTick(state, t))
  }
  return { snaps, log: state.log }
}

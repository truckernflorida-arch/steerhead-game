import type { CauseId, CauseLog, CauseSnap } from './types'

/** Diff previous vs next cause lists; append enter/exit rows. Pure. */
export function logCauseTransitions(
  t: number,
  prev: CauseSnap[],
  next: CauseSnap[],
  log: CauseLog,
): CauseLog {
  const prevIds = new Set(prev.map((c) => c.id))
  const nextIds = new Set(next.map((c) => c.id))
  const active = next.map((c) => c.id)
  const out = log.slice()

  for (const c of next) {
    if (!prevIds.has(c.id)) {
      out.push({ t, kind: 'enter', cause: c, active: active.slice() })
    }
  }
  for (const c of prev) {
    if (!nextIds.has(c.id)) {
      out.push({ t, kind: 'exit', cause: c, active: active.slice() })
    }
  }
  return out
}

export function activeCauseIds(log: CauseLog): CauseId[] {
  const last = log[log.length - 1]
  return last ? last.active.slice() : []
}

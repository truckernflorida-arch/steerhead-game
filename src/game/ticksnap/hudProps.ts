/**
 * HUD consumes TickSnap only — no TF_* / RV_* branching in UI.
 * Map chips with data from the snap (label, enabled), not id switches.
 */
import type { CauseLog, TickSnap, VerbId } from './types'

export type TrainerHudProps = {
  /** Latest physics frame — sole input for symptoms + verb chips */
  snap: TickSnap
  /** Optional: full debrief log (read-only in HUD / shown on debrief screen) */
  causeLog?: CauseLog
  /** Player tapped a verb chip — forward id to physics; UI does not interpret */
  onVerb?: (id: VerbId) => void
  /** Show trainer detail vars */
  detailOpen?: boolean
  onToggleDetail?: () => void
}

/**
 * Pure view-model helpers (still no cause invention — only project snap fields).
 */
export function verbChips(snap: TickSnap) {
  return snap.verbs.map((v) => ({
    key: v.id,
    label: v.label,
    enabled: v.enabled,
  }))
}

export function statusStrip(snap: TickSnap) {
  return snap.symptoms.map((s) => ({
    key: s.id,
    label: s.label,
    severity: s.severity,
  }))
}

export function primaryMeters(snap: TickSnap) {
  const h = snap.hud
  return [
    { key: 'weight', label: 'Mud wt', value: h.mudWeight },
    { key: 'vis', label: 'Vis', value: h.viscosity },
    { key: 'gpm', label: 'GPM', value: h.pumpGpm },
    { key: 'returns', label: 'Returns', value: h.returns },
    { key: 'psi', label: 'Annular PSI', value: h.annularPsi },
    { key: 'pitch', label: 'Pitch', value: h.pitchDeg },
  ]
}

/**
 * Example React signature (types only — keep component in ui/ later):
 *
 *   function TrainerHud({ snap, onVerb, detailOpen }: TrainerHudProps) {
 *     return (
 *       <>
 *         {statusStrip(snap).map((s) => <Symptom key={s.key} {...s} />)}
 *         {verbChips(snap).map((v) => (
 *           <button key={v.key} disabled={!v.enabled} onClick={() => onVerb?.(v.key as VerbId)}>
 *             {v.label}
 *           </button>
 *         ))}
 *         {primaryMeters(snap).map((m) => <Meter key={m.key} {...m} />)}
 *       </>
 *     )
 *   }
 *
 * ❌ Never: if (snap.causes.find(c => c.id === 'TF_PACK_OFF')) show X
 * ✅ Always: render snap.symptoms / snap.verbs labels physics already chose
 */

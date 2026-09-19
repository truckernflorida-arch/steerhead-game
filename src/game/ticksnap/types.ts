/**
 * TickSnap — only physics → UI contract (GDD v1.2.1+).
 *
 * Physics owns causes[] and verbs[].
 * UI renders symptoms + verb chips only — never invents TF_* / RV_* via if/else.
 */

/** Intermediate + terminal taught-fail causes. Physics is source of truth. */
export type CauseId =
  | 'TF_MIXER_DEAD'
  | 'TF_PRESSURE_DROP'
  | 'TF_PACK_OFF'
  | 'TF_PACKED_HEAD'
  | 'TF_COLLAPSE_BEHIND'
  | 'TF_TWIST_WALK'
  | 'TF_DIRTY_RECYCLE'
  | 'TF_PACK_FRAC_THICK'
  | 'TF_FRAC_THIN'
  | 'TF_PANIC_DOGLEG'
  | (string & { readonly __causeBrand?: unique symbol }) // allow physics to extend without UI switches

/** Recovery verbs — RV_* ids owned by physics; labels come on the snap. */
export type VerbId =
  | 'RV_ADD_BENTONITE'
  | 'RV_ADD_WATER'
  | 'RV_RESTORE_MIXER'
  | 'RV_JET_CLEAN'
  | 'RV_RECIPROCATE'
  | 'RV_EASE_THRUST'
  | 'RV_HOLD_RPM'
  | 'RV_CUT_RECYCLE'
  | 'RV_CIRCULATE_NO_PUSH'
  | (string & { readonly __verbBrand?: unique symbol })

/** Display-ready status strip / cue — physics fills label + severity. */
export type SymptomSnap = {
  id: string
  label: string // e.g. "HEAD PACKED", "FRAC RISK"
  severity: 'info' | 'warn' | 'critical'
}

export type CauseSnap = {
  id: CauseId
  /** Crew-language line for debrief; physics-authored */
  label: string
  /** Cascade / field-condition tag when relevant (e.g. FC-01, cascade A) */
  tag?: string
}

export type VerbSnap = {
  id: VerbId
  label: string // chip text — physics-authored, UI does not map
  enabled: boolean
}

export type TrainerHudVars = {
  mudWeight: number
  viscosity: number
  pumpGpm: number
  returns: number
  annularPsi: number
  pitchDeg: number
  // detail (toggle OK)
  gel?: number
  packOff?: number
  steerAuthority?: number
  rop?: number
  cleanIndex?: number
  tankVolume?: number
  mixerOn?: boolean
  sandPct?: number
}

/** One frame of truth from physics to UI. */
export type TickSnap = {
  t: number // sim time seconds
  phase: 'brief' | 'mix' | 'pilot' | 'ream' | 'pull' | 'debrief'
  /** Active causes this tick (ordered: oldest → newest) */
  causes: CauseSnap[]
  /** Recovery chips to show — only what physics offers now */
  verbs: VerbSnap[]
  /** Status strip — render as-is */
  symptoms: SymptomSnap[]
  hud: TrainerHudVars
  /** Soft gates / outcomes physics already decided */
  flags: {
    taughtFail?: CauseId
    strike?: boolean
    wrongDaylightSoft?: boolean
    cleanPass?: boolean
  }
}

/** Append-only debrief log — one entry per cause enter/exit. */
export type CauseTransition = {
  t: number
  kind: 'enter' | 'exit'
  cause: CauseSnap
  /** causes[] snapshot after the transition */
  active: CauseId[]
}

export type CauseLog = CauseTransition[]

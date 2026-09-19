/**
 * TickSnap — sole physics → UI contract (GDD v1.2.1+).
 * Physics owns causes[] and verbs[]. UI never invents TF_* / RV_* via if/else.
 */

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
  | (string & { readonly __causeBrand?: unique symbol })

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

export type SymptomSnap = {
  id: string
  label: string
  severity: 'info' | 'warn' | 'critical'
}

export type CauseSnap = {
  id: CauseId
  label: string
  tag?: string
}

export type VerbSnap = {
  id: VerbId
  label: string
  enabled: boolean
}

export type ApwaMarkSnap = {
  color: string
  type: string
  depth_ft: number
  sta_ft?: number
  label: string
  role?: string
}

export type TrainerHudVars = {
  mudWeight: number
  viscosity: number
  pumpGpm: number
  returns: number
  annularPsi: number
  pitchDeg: number
  // locator (Lesson 1)
  depthFt?: number
  stationFt?: number
  clockHour?: number
  clockAngleDeg?: number
  targetDepthFt?: number
  signalBars?: number
  apwa?: ApwaMarkSnap[]
  gradeHoldPct?: number
  // detail
  gel?: number
  packOff?: number
  steerAuthority?: number
  rop?: number
  cleanIndex?: number
  tankVolume?: number
  mixerOn?: boolean
  sandPct?: number
}

export type TickSnap = {
  t: number
  phase: 'brief' | 'mix' | 'pilot' | 'ream' | 'pull' | 'debrief'
  causes: CauseSnap[]
  verbs: VerbSnap[]
  symptoms: SymptomSnap[]
  hud: TrainerHudVars
  flags: {
    taughtFail?: CauseId
    strike?: boolean
    wrongDaylightSoft?: boolean
    cleanPass?: boolean
    daylight?: boolean
  }
  debrief?: {
    headline: string
    body: string
    ticketScore?: number
  }
}

export type CauseTransition = {
  t: number
  kind: 'enter' | 'exit'
  cause: CauseSnap
  active: CauseId[]
}

export type CauseLog = CauseTransition[]

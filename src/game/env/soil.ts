/**
 * SOIL_FOUR pack + Lesson 1 light_fill → dirt alias.
 * Canonical L1 numbers: steerhead/contracts/soil/light_fill.ts LIGHT_FILL.
 * Sand/clay/rock stay in table locked — not used by Lesson 1 update.
 */
export type SoilFour = 'dirt' | 'sand' | 'clay' | 'rock'

/** School / job-card soil ids that resolve into the four-pack */
export type SoilAliasId = 'light_fill' | SoilFour

export const LESSON1_SOIL_ID: SoilAliasId = 'light_fill'

export type SoilFourParams = {
  id: SoilFour
  label: string
  /** School alias when present (dirt ← light_fill) */
  schoolId?: 'light_fill'
  unlocked: boolean

  hardness: number
  thrustResponse: number
  ropMin_m_s: number
  ropMax_m_s: number
  /** Inclusive ROP band at thrust 0.3–1.0 */
  ropRange_m_s: readonly [number, number]
  steerAuthority: number
  maxSteerDegPerM: number
  walkBias_deg_m: number
  walkNoiseAmp: number
  walkLateral: number

  fluidNeed: number
  viscosityGreen: readonly [number, number]
  gelNeed: number
  collapseNeed: number
  fracGradient: number
  pressureBuild: number
  packOffGen: number
  ballingRate: number
  bitWearRate: number
  vibration: number
  torqueMult: number
  stuckRisk: number
  fracRisk: number
  falseFootageRate: number
  buckleRiskOnPush: number
  mapFailureChains: string
}

/**
 * Dirt row = LIGHT_FILL mechanical + fluid numbers from contracts/soil/light_fill.ts.
 * Four-pack sand/clay/rock from soil-four-pack-v1.md — locked for L1.
 */
export const SOIL_FOUR: Record<SoilFour, SoilFourParams> = {
  dirt: {
    id: 'dirt',
    label: 'Dirt / light fill',
    schoolId: 'light_fill',
    unlocked: true,

    hardness: 0.3,
    thrustResponse: 1.15,
    ropMin_m_s: 0.18,
    ropMax_m_s: 0.42,
    ropRange_m_s: [0.18, 0.42],
    steerAuthority: 0.65,
    maxSteerDegPerM: 0.7,
    walkBias_deg_m: 0.06,
    walkNoiseAmp: 0.06,
    walkLateral: 0.04,

    fluidNeed: 0.85,
    viscosityGreen: [28, 40],
    gelNeed: 0.45,
    collapseNeed: 0.45,
    fracGradient: 18,
    pressureBuild: 0.9,
    packOffGen: 0.4,
    ballingRate: 0.03,
    bitWearRate: 0.35,
    vibration: 0.1,
    torqueMult: 0.9,
    stuckRisk: 0.4,
    fracRisk: 0.45,
    falseFootageRate: 0.05,
    buckleRiskOnPush: 0.5,
    mapFailureChains: 'light_fill',
  },
  sand: {
    id: 'sand',
    label: 'Sand / running',
    unlocked: false,

    hardness: 0.25,
    thrustResponse: 1.25,
    ropMin_m_s: 0.22,
    ropMax_m_s: 0.48,
    ropRange_m_s: [0.22, 0.48],
    steerAuthority: 0.75,
    maxSteerDegPerM: 0.9,
    walkBias_deg_m: 0.04,
    walkNoiseAmp: 0.08,
    walkLateral: 0.06,

    fluidNeed: 1.25,
    viscosityGreen: [40, 54],
    gelNeed: 0.65,
    collapseNeed: 0.9,
    fracGradient: 14,
    pressureBuild: 0.7,
    packOffGen: 0.55,
    ballingRate: 0.01,
    bitWearRate: 0.55,
    vibration: 0.15,
    torqueMult: 0.85,
    stuckRisk: 0.55,
    fracRisk: 0.75,
    falseFootageRate: 0,
    buckleRiskOnPush: 0.8,
    mapFailureChains: 'running_sand',
  },
  clay: {
    id: 'clay',
    label: 'Clay / fat',
    unlocked: false,

    hardness: 0.4,
    thrustResponse: 0.7,
    ropMin_m_s: 0.1,
    ropMax_m_s: 0.28,
    ropRange_m_s: [0.1, 0.28],
    steerAuthority: 0.28,
    maxSteerDegPerM: 0.3,
    walkBias_deg_m: 0.1,
    walkNoiseAmp: 0.05,
    walkLateral: 0,

    fluidNeed: 1.05,
    viscosityGreen: [42, 56],
    gelNeed: 0.55,
    collapseNeed: 0.4,
    fracGradient: 20,
    pressureBuild: 1.35,
    packOffGen: 0.45,
    ballingRate: 0.12,
    bitWearRate: 0.4,
    vibration: 0.08,
    torqueMult: 1.05,
    stuckRisk: 0.85,
    fracRisk: 0.35,
    falseFootageRate: 0.3,
    buckleRiskOnPush: 0.35,
    mapFailureChains: 'fat_clay',
  },
  rock: {
    id: 'rock',
    label: 'Rock',
    unlocked: false,

    hardness: 0.9,
    thrustResponse: 0.35,
    ropMin_m_s: 0.04,
    ropMax_m_s: 0.12,
    ropRange_m_s: [0.04, 0.12],
    steerAuthority: 0.12,
    maxSteerDegPerM: 0.08,
    walkBias_deg_m: 0.02,
    walkNoiseAmp: 0.04,
    walkLateral: 0,

    fluidNeed: 0.7,
    viscosityGreen: [34, 48],
    gelNeed: 0.4,
    collapseNeed: 0.25,
    fracGradient: 22,
    pressureBuild: 0.9,
    packOffGen: 0.25,
    ballingRate: 0,
    bitWearRate: 1.4,
    vibration: 0.85,
    torqueMult: 1.35,
    stuckRisk: 0.5,
    fracRisk: 0.25,
    falseFootageRate: 0,
    buckleRiskOnPush: 0.15,
    mapFailureChains: 'rock',
  },
}

/** Alias map: light_fill → dirt (also accept dirt) */
export const SOIL_ALIAS: Record<SoilAliasId, SoilFour> = {
  light_fill: 'dirt',
  dirt: 'dirt',
  sand: 'sand',
  clay: 'clay',
  rock: 'rock',
}

/** Lesson 1 teaching extras from LIGHT_FILL contract (not on locked soils). */
export const LIGHT_FILL_TEACH = {
  /** Hard taught fails are utility strike / too deep; panic dogleg is warn-only */
  signatureTaughtFail: 'TF_UTILITY_STRIKE' as const,
  secondaryFails: ['TF_TOO_DEEP', 'TF_PACKED_HEAD', 'TF_FRAC_THIN'] as const,
  panicDoglegDegPerM: 0.55,
  panicDoglegWarnCount: 99,
  gradeWindow_deg: 1.5,
  gradeHoldPass: 0.7,
  mudWeightGreen_ppg: [8.4, 9.0] as const,
  pressureGreen: [32, 72] as const,
  packWarn: 0.7,
  packLock: 0.95,
  fracAmber: 70,
  fracRedline: 85,
  /**
   * Discrete Push teaching pitch (° per ft at |clockAngleToSteer|=1).
   * 12 o'clock → climb (+): 1 ft ≈ +1°, 2 ft ≈ +2° on light_fill (HDD sign).
   * Scales by |clockAngleToSteer| so 1:30 is weaker than 12.
   * Physical maxSteerDegPerM (~0.7°/m) is too small for readable 1–2 ft pushes.
   */
  pushPitchDegPerFtAtFull12: 1.0,
}

export type ResolvedSoil = SoilFourParams & {
  aliasId: SoilAliasId
  fourPack: SoilFour
}

export function resolveSoilId(id: string = LESSON1_SOIL_ID): SoilFour {
  const key = id as SoilAliasId
  const four = SOIL_ALIAS[key]
  if (!four) {
    throw new Error(`Unknown soil id: ${id}`)
  }
  return four
}

/** Resolve school/four-pack id → params. L1 must use unlocked dirt only. */
export function getSoil(id: string = LESSON1_SOIL_ID): ResolvedSoil {
  const four = resolveSoilId(id)
  const row = SOIL_FOUR[four]
  return {
    ...row,
    aliasId: (id === 'light_fill' || four === 'dirt' ? 'light_fill' : four) as SoilAliasId,
    fourPack: four,
  }
}

/** Lesson 1 soil — always dirt / light_fill numbers. */
export function getLesson1Soil(): ResolvedSoil {
  return getSoil(LESSON1_SOIL_ID)
}

/** @deprecated use getSoil — kept for call sites that still say stub */
export function getSoilStub(id: string = LESSON1_SOIL_ID): ResolvedSoil {
  return getSoil(id)
}

/** Clamp pitch change along path length ds (meters). Spec: maxSteerDegPerM * ds. */
export function clampSteerDeltaDeg(
  wantedDeg: number,
  ds_m: number,
  soil: SoilFourParams,
): number {
  const cap = soil.maxSteerDegPerM * ds_m
  return Math.max(-cap, Math.min(cap, wantedDeg))
}

/**
 * Local progress schema stub.
 */
export const SAVE_SCHEMA_VERSION = 1 as const

export type ProgressSave = {
  schemaVersion: typeof SAVE_SCHEMA_VERSION
  /** Last completed school level id (S01…) */
  lastCompletedId?: string
  /** Unlocked level ids — S01 available by default */
  unlocked: string[]
}

export function emptyProgress(): ProgressSave {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    unlocked: ['S01'],
  }
}

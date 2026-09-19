/**
 * localStorage progress stub.
 */
import { emptyProgress, type ProgressSave, SAVE_SCHEMA_VERSION } from './schema'

const KEY = 'steerhead.progress.v1'

export function loadProgress(): ProgressSave {
  if (typeof localStorage === 'undefined') return emptyProgress()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as ProgressSave
    if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION) return emptyProgress()
    return parsed
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(p: ProgressSave): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(p))
}

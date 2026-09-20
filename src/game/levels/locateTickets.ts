/**
 * Bot 5 official locate tickets — source of truth for S01 walkover/collision/brief.
 * File: s01-locate-tickets.json (rev 3). No stubs: tickets normalize into ApwaMark[].
 */
import s01TicketsJson from './s01-locate-tickets.json'
import type { ApwaMark } from '../bore/profile'

export type LocateTicket = {
  id: string
  apwa: string
  type: string
  label: string
  owner?: string
  depth_ft: number
  sta_ft?: number
  offsetFromCL_ft: number
  crossesCL: boolean
  ticketText?: string
  clearanceNote?: string
}

export type LocateTicketsFile = {
  levelId: string
  rev: number
  viewPrimary?: string
  centerline?: unknown
  locateTickets: LocateTicket[]
}

const s01File = s01TicketsJson as LocateTicketsFile

export function loadS01LocateTickets(): LocateTicketsFile {
  return s01File
}

/** Wide clearance if ticket note says so (Bot 5 S01 gas). */
function clearanceFromNote(note?: string): string | undefined {
  if (!note) return undefined
  const n = note.toLowerCase()
  if (n.includes('wide')) return 'wide'
  if (n.includes('tight')) return 'tight'
  return undefined
}

/** Normalize one Bot 5 ticket into engine ApwaMark (offset_ft = offsetFromCL_ft). */
export function ticketToApwaMark(t: LocateTicket): ApwaMark {
  const offset = Number(t.offsetFromCL_ft)
  return {
    color: String(t.apwa || 'yellow'),
    type: String(t.type || 'utility'),
    depth_ft: Number(t.depth_ft),
    sta_ft: t.sta_ft != null ? Number(t.sta_ft) : undefined,
    offset_ft: Number.isFinite(offset) ? offset : 0,
    clearance: clearanceFromNote(t.clearanceNote),
    role: t.crossesCL === false ? 'parallel_brief_only' : undefined,
    label: t.label,
    ticketText: t.ticketText,
    id: t.id,
    crossesCL: t.crossesCL,
  }
}

/** S01 APWA marks from official tickets — always prefer this over stale school apwa. */
export function s01ApwaFromTickets(): ApwaMark[] {
  return (s01File.locateTickets ?? []).map(ticketToApwaMark)
}

export function s01ViewPrimary(): string {
  return s01File.viewPrimary ?? 'walkover_plan'
}

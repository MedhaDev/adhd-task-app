import { supabase } from '../lib/supabase'
import type { Json } from '../lib/database.types'
import { dayStart } from './today'

/** One row of the events log, as the database returns it. */
export type EventRecord = {
  occurred_at: string
  name: string
  task_id: string | null
  details: Json
  tasks: { title: string } | null
}

const PAGE = 1000

/** Every event, oldest first, fetched in pages so nothing is cut off. */
export async function fetchAllEvents(): Promise<EventRecord[]> {
  const all: EventRecord[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('events')
      .select('occurred_at, name, task_id, details, tasks(title)')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...(data as EventRecord[]))
    if (data.length < PAGE) return all
  }
}

/** The detail fields worth their own column; anything else stays in details_json. */
const DETAIL_COLUMNS = [
  'area',
  'status',
  'from',
  'to',
  'kind',
  'planned_minutes',
  'outcome',
  'minutes',
  'position',
  'session_id',
  'step_id',
  'parked_id',
] as const

export const CSV_COLUMNS = [
  'occurred_at_utc',
  'day',
  'local_time',
  'weekday',
  'event',
  'task_id',
  'task_title',
  ...DETAIL_COLUMNS,
  'details_json',
] as const

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** The "day" an event belongs to, using the same 4am rule as the app. */
function dayLabel(d: Date): string {
  const start = dayStart(d)
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
}

export function eventsToRows(events: EventRecord[]): string[][] {
  return events.map((e) => {
    const when = new Date(e.occurred_at)
    const details = (e.details && typeof e.details === 'object' && !Array.isArray(e.details) ? e.details : {}) as Record<
      string,
      Json | undefined
    >
    const detailCells = DETAIL_COLUMNS.map((key) => {
      const value = details[key]
      return value === null || value === undefined ? '' : String(value)
    })
    return [
      e.occurred_at,
      dayLabel(when),
      `${pad(when.getHours())}:${pad(when.getMinutes())}:${pad(when.getSeconds())}`,
      when.toLocaleDateString('en-GB', { weekday: 'short' }),
      e.name,
      e.task_id ?? (typeof details.task_id === 'string' ? details.task_id : ''),
      e.tasks?.title ?? '',
      ...detailCells,
      JSON.stringify(details),
    ]
  })
}

/**
 * One CSV cell. Quotes when needed, and puts an apostrophe before text that a
 * spreadsheet might otherwise run as a formula (=, +, -, @).
 */
export function csvCell(value: string): string {
  let v = value
  if (/^[=+\-@\t\r]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) v = `'${v}`
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCsv(header: readonly string[], rows: string[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function exportFileName(now: Date = new Date()): string {
  return `today-events-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`
}

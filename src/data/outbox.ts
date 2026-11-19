import type { Area } from './areas'

/**
 * New tasks wait here on the device until the database confirms them.
 * If a save fails, or the tab closes mid-save, the task is still here and is
 * retried next time, so a task is never silently lost.
 */
export type PendingTask = { id: string; title: string; area: Area | null; createdAt: string }

const KEY = 'today.outbox'
let memoryFallback: PendingTask[] = []

function read(): PendingTask[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PendingTask[]) : []
  } catch {
    return memoryFallback
  }
}

function write(items: PendingTask[]): void {
  memoryFallback = items
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Storage blocked: the in-memory copy still protects the task this session.
  }
}

export const outbox = {
  list: read,
  add(item: PendingTask): void {
    write([item, ...read().filter((p) => p.id !== item.id)])
  },
  remove(id: string): void {
    write(read().filter((p) => p.id !== id))
  },
}

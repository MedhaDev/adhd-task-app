import { supabase } from '../lib/supabase'

export type Parked = { id: string; body: string; sessionId: string | null; createdAt: string }

/** Thoughts parked but not yet kept or deleted, oldest first. */
export async function fetchUnresolvedParked(): Promise<Parked[]> {
  const { data, error } = await supabase
    .from('parked_thoughts')
    .select('id, body, session_id, created_at')
    .is('resolution', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map((r) => ({ id: r.id, body: r.body, sessionId: r.session_id, createdAt: r.created_at }))
}

/** Saves a parked thought. The id is made on the device, so a retry can't save it twice. */
export async function insertParked(p: Parked): Promise<void> {
  const row = { id: p.id, body: p.body, session_id: p.sessionId, created_at: p.createdAt }
  let { error } = await supabase.from('parked_thoughts').insert(row)
  // If its timer never got saved, keep the thought anyway, just without the link.
  if (error?.code === '23503') ({ error } = await supabase.from('parked_thoughts').insert({ ...row, session_id: null }))
  if (error && error.code !== '23505') throw error
}

export async function resolveParked(id: string, resolution: 'kept' | 'deleted'): Promise<void> {
  const { error } = await supabase
    .from('parked_thoughts')
    .update({ resolution, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

const KEY = 'today.parkedOutbox'
let memoryFallback: Parked[] = []

/** Parked thoughts waiting on this device until the database confirms them. */
export const parkedOutbox = {
  list(): Parked[] {
    try {
      const raw = window.localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as Parked[]) : []
    } catch {
      return memoryFallback
    }
  },
  write(items: Parked[]): void {
    memoryFallback = items
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      // Storage blocked: the in-memory copy still protects it this session.
    }
  },
  add(p: Parked): void {
    this.write([...this.list().filter((x) => x.id !== p.id), p])
  },
  remove(id: string): void {
    this.write(this.list().filter((x) => x.id !== id))
  },
}

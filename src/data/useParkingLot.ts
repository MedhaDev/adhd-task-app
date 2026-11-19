import { useCallback, useEffect, useState } from 'react'
import { outbox as taskOutbox } from './outbox'
import { fetchUnresolvedParked, insertParked, parkedOutbox, resolveParked, type Parked } from './parked'
import { insertTask } from './tasks'

export type ParkedItem = Parked & { saved: boolean }

export function useParkingLot() {
  const [items, setItems] = useState<ParkedItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (p: Parked) => {
    try {
      await insertParked(p)
      parkedOutbox.remove(p.id)
      setItems((list) => list.map((i) => (i.id === p.id ? { ...i, saved: true } : i)))
    } catch {
      // Stays in the device outbox and is retried next time; nothing is lost.
    }
  }, [])

  useEffect(() => {
    const waiting = parkedOutbox.list()
    setItems(waiting.map((p) => ({ ...p, saved: false })))
    fetchUnresolvedParked()
      .then((saved) => {
        const savedIds = new Set(saved.map((s) => s.id))
        waiting.filter((w) => savedIds.has(w.id)).forEach((w) => parkedOutbox.remove(w.id))
        const unsent = waiting.filter((w) => !savedIds.has(w.id))
        setItems([...saved.map((s) => ({ ...s, saved: true })), ...unsent.map((p) => ({ ...p, saved: false }))])
        unsent.forEach((p) => void save(p))
      })
      .catch(() => {
        // Offline: show what's on this device; it saves later.
      })
  }, [save])

  /** Park a thought during a timer. It's on the device first, then saved. */
  const park = useCallback(
    (body: string, sessionId: string | null) => {
      const trimmed = body.trim()
      if (!trimmed) return
      const p: Parked = { id: crypto.randomUUID(), body: trimmed, sessionId, createdAt: new Date().toISOString() }
      parkedOutbox.add(p)
      setItems((list) => [...list, { ...p, saved: false }])
      void save(p)
    },
    [save],
  )

  /** Keep a parked thought as a task in Later. */
  const keep = useCallback(async (item: ParkedItem) => {
    setError(null)
    const task = { id: crypto.randomUUID(), title: item.body, area: null, createdAt: new Date().toISOString() }
    // The task goes through the Later outbox, so it can't be lost even if this fails.
    taskOutbox.add(task)
    setItems((list) => list.filter((i) => i.id !== item.id))
    try {
      await insertTask({ id: task.id, title: task.title, area: null })
      taskOutbox.remove(task.id)
    } catch {
      setError(`"${item.body}" is kept on this device and will be saved to Later when the connection is back.`)
    }
    try {
      if (item.saved) await resolveParked(item.id, 'kept')
      else parkedOutbox.remove(item.id)
    } catch {
      // The task is safe in Later; marking the thought resolved can be retried later.
    }
  }, [])

  const discard = useCallback(async (item: ParkedItem) => {
    setError(null)
    setItems((list) => list.filter((i) => i.id !== item.id))
    try {
      if (item.saved) await resolveParked(item.id, 'deleted')
      else parkedOutbox.remove(item.id)
    } catch {
      setItems((list) => [...list, item])
      setError(`Couldn't delete "${item.body}". Try again.`)
    }
  }, [])

  return { items, error, park, keep, discard, dismissError: () => setError(null) }
}

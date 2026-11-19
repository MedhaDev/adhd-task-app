import { useCallback, useEffect, useRef, useState } from 'react'
import type { Area } from './areas'
import { outbox, type PendingTask } from './outbox'
import { deleteTask, fetchLaterTasks, insertTask, updateTaskArea, type Task } from './tasks'

export type SaveState = 'saved' | 'saving' | 'failed'
export type LaterItem = { id: string; title: string; area: Area | null; createdAt: string; save: SaveState }

const UNDO_MS = 5000

function fromTask(t: Task): LaterItem {
  return { id: t.id, title: t.title, area: t.area, createdAt: t.created_at, save: 'saved' }
}

function fromPending(p: PendingTask, save: SaveState): LaterItem {
  return { id: p.id, title: p.title, area: p.area, createdAt: p.createdAt, save }
}

function newId(): string {
  return crypto.randomUUID()
}

export function useLaterTasks() {
  const [items, setItems] = useState<LaterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [recentlyDeleted, setRecentlyDeleted] = useState<LaterItem | null>(null)
  const deleteTimer = useRef<number | null>(null)

  const patch = useCallback((id: string, change: Partial<LaterItem>) => {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item)))
  }, [])

  const save = useCallback(
    async (pending: PendingTask) => {
      patch(pending.id, { save: 'saving' })
      try {
        await insertTask({ id: pending.id, title: pending.title, area: pending.area })
        outbox.remove(pending.id)
        patch(pending.id, { save: 'saved' })
      } catch {
        patch(pending.id, { save: 'failed' })
      }
    },
    [patch],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    const waiting = outbox.list()
    try {
      const saved = (await fetchLaterTasks()).map(fromTask)
      const savedIds = new Set(saved.map((s) => s.id))
      const unsent = waiting.filter((p) => !savedIds.has(p.id))
      waiting.filter((p) => savedIds.has(p.id)).forEach((p) => outbox.remove(p.id))
      setItems([...unsent.map((p) => fromPending(p, 'saving')), ...saved])
      unsent.forEach((p) => void save(p))
    } catch {
      // Still show tasks waiting on this device, so nothing looks lost.
      setItems(waiting.map((p) => fromPending(p, 'failed')))
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [save])

  useEffect(() => {
    void load()
  }, [load])

  const add = useCallback(
    (title: string, area: Area | null) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const pending: PendingTask = { id: newId(), title: trimmed, area, createdAt: new Date().toISOString() }
      outbox.add(pending)
      setItems((list) => [fromPending(pending, 'saving'), ...list])
      void save(pending)
    },
    [save],
  )

  const retry = useCallback(
    (id: string) => {
      const pending = outbox.list().find((p) => p.id === id)
      if (pending) void save(pending)
    },
    [save],
  )

  const setArea = useCallback(
    async (id: string, area: Area | null) => {
      const before = items.find((i) => i.id === id)
      if (!before) return
      setActionError(null)
      patch(id, { area })
      if (before.save !== 'saved') {
        // Not in the database yet: update the copy waiting on this device.
        const pending = outbox.list().find((p) => p.id === id)
        if (pending) outbox.add({ ...pending, area })
        return
      }
      try {
        await updateTaskArea(id, area)
      } catch {
        patch(id, { area: before.area })
        setActionError(`Couldn't change the area of "${before.title}". Try again.`)
      }
    },
    [items, patch],
  )

  const finishDelete = useCallback(async (item: LaterItem) => {
    deleteTimer.current = null
    setRecentlyDeleted(null)
    try {
      // Remove the device copy first so an unsaved task isn't retried, then
      // delete from the database (a no-op if it never got there).
      outbox.remove(item.id)
      await deleteTask(item.id)
    } catch {
      setItems((list) => [item, ...list])
      setActionError(`Couldn't delete "${item.title}", so it's back in the list. Try again.`)
    }
  }, [])

  const remove = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id)
      if (!item) return
      // Only one undo at a time: finish any earlier delete straight away.
      if (deleteTimer.current !== null && recentlyDeleted) {
        window.clearTimeout(deleteTimer.current)
        void finishDelete(recentlyDeleted)
      }
      setItems((list) => list.filter((i) => i.id !== id))
      setRecentlyDeleted(item)
      deleteTimer.current = window.setTimeout(() => void finishDelete(item), UNDO_MS)
    },
    [items, recentlyDeleted, finishDelete],
  )

  const undoDelete = useCallback(() => {
    if (deleteTimer.current !== null) window.clearTimeout(deleteTimer.current)
    deleteTimer.current = null
    if (recentlyDeleted) {
      const restored = recentlyDeleted
      setItems((list) => [restored, ...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }
    setRecentlyDeleted(null)
  }, [recentlyDeleted])

  return {
    items,
    loading,
    loadError,
    actionError,
    recentlyDeleted,
    reload: load,
    add,
    retry,
    setArea,
    remove,
    undoDelete,
    dismissError: () => setActionError(null),
  }
}

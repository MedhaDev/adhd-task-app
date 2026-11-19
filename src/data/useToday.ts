import { useCallback, useEffect, useState } from 'react'
import { dayStart, fetchToday, finishTask, resetToday, sendBackToLater, startHere, type DoneTask, type TodayTask } from './today'

export function useToday() {
  const [active, setActive] = useState<TodayTask[]>([])
  const [done, setDone] = useState<DoneTask[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    const since = dayStart()
    try {
      await resetToday(since)
      const result = await fetchToday(since)
      setActive(result.active)
      setDone(result.done)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const run = useCallback(
    async (action: () => Promise<void>, failure: string) => {
      setActionError(null)
      try {
        await action()
      } catch {
        setActionError(failure)
      }
      await load()
    },
    [load],
  )

  return {
    active,
    done,
    loading,
    loadError,
    actionError,
    reload: load,
    finish: (task: TodayTask) => run(() => finishTask(task.id), `Couldn't mark "${task.title}" done. Try again.`),
    putFirst: (task: TodayTask) => run(() => startHere(task.id), `Couldn't move "${task.title}" to the top. Try again.`),
    backToLater: (task: TodayTask) =>
      run(() => sendBackToLater(task.id), `Couldn't move "${task.title}" back to Later. Try again.`),
    dismissError: () => setActionError(null),
  }
}

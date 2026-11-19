import { useCallback, useEffect, useState } from 'react'
import {
  addStep,
  dayStart,
  fetchToday,
  finishTask,
  resetToday,
  sendBackToLater,
  setStepDone,
  startHere,
  type DoneTask,
  type Step,
  type TodayTask,
} from './today'

export function useToday() {
  const [active, setActive] = useState<TodayTask[]>([])
  const [done, setDone] = useState<DoneTask[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // No "Loading…" flash on reloads after an action: the list stays in place.
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

  const patchSteps = useCallback((taskId: string, change: (steps: Step[]) => Step[]) => {
    setActive((tasks) => tasks.map((t) => (t.id === taskId ? { ...t, steps: change(t.steps) } : t)))
  }, [])

  /** Tick or untick a step right away; put it back and say so if saving fails. */
  const toggleStep = useCallback(
    async (task: TodayTask, step: Step) => {
      const nowDone = step.done_at === null
      const doneAt = nowDone ? new Date().toISOString() : null
      setActionError(null)
      patchSteps(task.id, (steps) => steps.map((s) => (s.id === step.id ? { ...s, done_at: doneAt } : s)))
      try {
        await setStepDone(step.id, nowDone)
      } catch {
        patchSteps(task.id, (steps) => steps.map((s) => (s.id === step.id ? { ...s, done_at: step.done_at } : s)))
        setActionError(`Couldn't save the tick on "${step.body}". Try again.`)
      }
    },
    [patchSteps],
  )

  /** Adds a step. Returns false if it couldn't be saved, so the typed text can stay. */
  const addStepTo = useCallback(
    async (task: TodayTask, body: string): Promise<boolean> => {
      const trimmed = body.trim()
      if (!trimmed) return false
      const position = task.steps.reduce((max, s) => Math.max(max, s.position), -1) + 1
      const step: Step = { id: crypto.randomUUID(), body: trimmed, position, done_at: null }
      setActionError(null)
      patchSteps(task.id, (steps) => [...steps, step])
      try {
        await addStep({ id: step.id, taskId: task.id, body: trimmed, position })
        return true
      } catch {
        patchSteps(task.id, (steps) => steps.filter((s) => s.id !== step.id))
        setActionError(`Couldn't add the step "${trimmed}". It's still in the box; try again.`)
        return false
      }
    },
    [patchSteps],
  )

  return {
    active,
    done,
    loading,
    loadError,
    actionError,
    reload: load,
    toggleStep,
    addStepTo,
    finish: (task: TodayTask) => run(() => finishTask(task.id), `Couldn't mark "${task.title}" done. Try again.`),
    putFirst: (task: TodayTask) => run(() => startHere(task.id), `Couldn't move "${task.title}" to the top. Try again.`),
    backToLater: (task: TodayTask) =>
      run(() => sendBackToLater(task.id), `Couldn't move "${task.title}" back to Later. Try again.`),
    dismissError: () => setActionError(null),
  }
}

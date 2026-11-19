import { useCallback, useEffect, useState } from 'react'
import { dayStart } from '../data/today'
import { fetchSessionsSince, saveSession } from '../data/timerSessions'
import {
  isStale,
  minutesShownUp,
  plannedEnd,
  remainingMs,
  type Minutes,
  type SessionKind,
  type TimerSession,
} from './clock'

/** What's on screen while a timer runs. Kept on the device so a reload resumes it. */
export type ActiveTimer = { session: TimerSession; taskTitle: string; stepBody: string | null }
export type Phase = 'idle' | 'running' | 'ended'

const KEY = 'today.timer'

function readActive(): ActiveTimer | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ActiveTimer) : null
  } catch {
    return null
  }
}

function writeActive(active: ActiveTimer | null): void {
  try {
    if (active) window.localStorage.setItem(KEY, JSON.stringify(active))
    else window.localStorage.removeItem(KEY)
  } catch {
    // Without storage the timer still runs; it just won't survive a reload.
  }
}

export function useTimer() {
  const [active, setActive] = useState<ActiveTimer | null>(() => readActive())
  const [now, setNow] = useState(() => Date.now())
  const [todaySessions, setTodaySessions] = useState<TimerSession[]>([])
  const [saveWarning, setSaveWarning] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const persist = useCallback(async (session: TimerSession) => {
    setTodaySessions((list) => [...list.filter((s) => s.id !== session.id), session])
    try {
      await saveSession(session)
      setSaveWarning(false)
    } catch {
      setSaveWarning(true)
    }
  }, [])

  // On open: close a timer left running long ago, and load today's minutes.
  useEffect(() => {
    const stored = readActive()
    if (stored && isStale(stored.session, Date.now())) {
      const closed: TimerSession = {
        ...stored.session,
        endedAt: new Date(plannedEnd(stored.session)).toISOString(),
        outcome: 'abandoned',
      }
      writeActive(null)
      setActive(null)
      void persist(closed)
    }
    fetchSessionsSince(dayStart())
      .then((sessions) =>
        setTodaySessions((local) => [...sessions.filter((s) => !local.some((l) => l.id === s.id)), ...local]),
      )
      .catch(() => {
        // The minutes counter is a nice-to-have; leave it at what this device knows.
      })
  }, [persist])

  // Tick once a second while a timer runs, and catch up when the tab wakes.
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active])

  const begin = useCallback(
    (target: { taskId: string | null; taskTitle: string; stepId: string | null; stepBody: string | null }, kind: SessionKind, minutes: Minutes) => {
      const session: TimerSession = {
        id: crypto.randomUUID(),
        taskId: target.taskId,
        stepId: target.stepId,
        kind,
        plannedMinutes: minutes,
        startedAt: new Date().toISOString(),
        endedAt: null,
        outcome: null,
      }
      const next = { session, taskTitle: target.taskTitle, stepBody: target.stepBody }
      setNote(null)
      setNow(Date.now())
      setActive(next)
      writeActive(next)
      void persist(session)
    },
    [persist],
  )

  const close = useCallback(
    (outcome: NonNullable<TimerSession['outcome']>): ActiveTimer | null => {
      if (!active) return null
      const endAt = Math.min(Date.now(), plannedEnd(active.session))
      const closed: TimerSession = { ...active.session, endedAt: new Date(endAt).toISOString(), outcome }
      setActive(null)
      writeActive(null)
      void persist(closed)
      return active
    },
    [active, persist],
  )

  const phase: Phase = !active ? 'idle' : remainingMs(active.session, now) > 0 ? 'running' : 'ended'

  const continueWith = useCallback(
    (kind: SessionKind, minutes: Minutes) => {
      const previous = close('kept_going')
      if (!previous) return
      begin(
        {
          taskId: previous.session.taskId,
          taskTitle: previous.taskTitle,
          stepId: previous.session.stepId,
          stepBody: previous.stepBody,
        },
        kind,
        minutes,
      )
    },
    [begin, close],
  )

  return {
    phase,
    active,
    remaining: active ? remainingMs(active.session, now) : 0,
    minutesToday: minutesShownUp(todaySessions, now),
    saveWarning,
    note,
    /** Start the 5-minute starter on a task's current step. */
    start: (target: { taskId: string; taskTitle: string; stepId: string | null; stepBody: string | null }) =>
      begin(target, 'starter', 5),
    /** After a starter or a break: keep going with a focus round. */
    keepGoing: (minutes: 15 | 25) => continueWith('focus', minutes),
    /** After a focus round: a 5-minute break. */
    takeBreak: () => continueWith('break', 5),
    /** Stop at any time. Stopping a starter still counts as a win. */
    stop: () => {
      const was = close('stopped')
      if (was?.session.kind === 'starter') setNote('You started. That counts.')
      else if (was?.session.kind === 'focus') setNote('Nice round. Stopping is fine.')
    },
    /** The task got done during the timer. Returns the task id to mark done. */
    finishTask: (): string | null => {
      const was = close('finished')
      if (was) setNote('Done. That one is off your plate.')
      return was?.session.taskId ?? null
    },
    dismissNote: () => setNote(null),
  }
}

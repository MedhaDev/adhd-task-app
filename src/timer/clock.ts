/**
 * Timer math. Time left is always worked out from when the timer started, not
 * by counting ticks, so it stays right if the tab sleeps or the phone locks.
 */
export type SessionKind = 'starter' | 'focus' | 'break'
export type Minutes = 5 | 15 | 25

export type TimerSession = {
  id: string
  taskId: string | null
  stepId: string | null
  kind: SessionKind
  plannedMinutes: Minutes
  startedAt: string
  endedAt: string | null
  outcome: 'kept_going' | 'stopped' | 'finished' | 'abandoned' | null
}

const MINUTE = 60_000

export function plannedEnd(session: Pick<TimerSession, 'startedAt' | 'plannedMinutes'>): number {
  return Date.parse(session.startedAt) + session.plannedMinutes * MINUTE
}

export function remainingMs(session: Pick<TimerSession, 'startedAt' | 'plannedMinutes'>, now: number): number {
  return Math.max(0, plannedEnd(session) - now)
}

/** 4:12, or 24:05. Rounds up so it never shows 0:00 while time is left. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** A timer left unanswered this long after it ended is closed as "abandoned". */
export const ABANDON_AFTER_MS = 30 * MINUTE

export function isStale(session: TimerSession, now: number): boolean {
  return session.endedAt === null && now > plannedEnd(session) + ABANDON_AFTER_MS
}

/**
 * Minutes spent on starters and focus rounds (not breaks) since the day began.
 * A running timer counts up to now; a finished one up to when it ended.
 */
export function minutesShownUp(
  sessions: Array<Pick<TimerSession, 'kind' | 'startedAt' | 'endedAt' | 'plannedMinutes'>>,
  now: number,
): number {
  let ms = 0
  for (const s of sessions) {
    if (s.kind === 'break') continue
    const start = Date.parse(s.startedAt)
    const end = s.endedAt ? Date.parse(s.endedAt) : Math.min(now, plannedEnd(s))
    ms += Math.max(0, end - start)
  }
  return Math.round(ms / MINUTE)
}

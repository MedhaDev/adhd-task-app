import { describe, expect, it } from 'vitest'
import { formatClock, isStale, minutesShownUp, remainingMs, type TimerSession } from './clock'

const T0 = Date.parse('2026-11-19T10:00:00Z')
const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString()

function session(over: Partial<TimerSession>): TimerSession {
  return {
    id: 's',
    taskId: 't',
    stepId: null,
    kind: 'starter',
    plannedMinutes: 5,
    startedAt: at(0),
    endedAt: null,
    outcome: null,
    ...over,
  }
}

describe('formatClock', () => {
  it('shows minutes and seconds', () => {
    expect(formatClock(4 * 60_000 + 12_000)).toBe('4:12')
    expect(formatClock(25 * 60_000)).toBe('25:00')
  })

  it('never shows 0:00 while time is left', () => {
    expect(formatClock(300)).toBe('0:01')
    expect(formatClock(0)).toBe('0:00')
  })
})

describe('remainingMs', () => {
  it('is worked out from the start time, so a sleeping tab stays right', () => {
    expect(remainingMs(session({}), T0 + 2 * 60_000)).toBe(3 * 60_000)
    expect(remainingMs(session({}), T0 + 9 * 60_000)).toBe(0)
  })
})

describe('isStale', () => {
  it('flags a timer left unanswered for over 30 minutes after it ended', () => {
    expect(isStale(session({}), T0 + 20 * 60_000)).toBe(false)
    expect(isStale(session({}), T0 + 36 * 60_000)).toBe(true)
    expect(isStale(session({ endedAt: at(5) }), T0 + 99 * 60_000)).toBe(false)
  })
})

describe('minutesShownUp', () => {
  it('adds starters and focus rounds, not breaks', () => {
    const sessions = [
      session({ endedAt: at(5) }),
      session({ kind: 'focus', plannedMinutes: 25, startedAt: at(5), endedAt: at(30) }),
      session({ kind: 'break', startedAt: at(30), endedAt: at(35) }),
    ]
    expect(minutesShownUp(sessions, T0 + 60 * 60_000)).toBe(30)
  })

  it('counts a stopped starter for the time it actually ran', () => {
    expect(minutesShownUp([session({ endedAt: at(2) })], T0 + 60 * 60_000)).toBe(2)
  })

  it('counts a running timer up to now', () => {
    expect(minutesShownUp([session({ kind: 'focus', plannedMinutes: 25 })], T0 + 10 * 60_000)).toBe(10)
  })
})

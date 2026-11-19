import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))
const { dayStart, moveErrorMessage } = await import('./today')

describe('dayStart (the day resets at 4am)', () => {
  it('a late night still counts as the same day', () => {
    const start = dayStart(new Date(2026, 10, 19, 2, 30))
    expect(start).toEqual(new Date(2026, 10, 18, 4, 0, 0, 0))
  })

  it('after 4am, the day starts at 4am today', () => {
    const start = dayStart(new Date(2026, 10, 19, 10, 0))
    expect(start).toEqual(new Date(2026, 10, 19, 4, 0, 0, 0))
  })

  it('exactly 4am is the new day', () => {
    expect(dayStart(new Date(2026, 10, 19, 4, 0))).toEqual(new Date(2026, 10, 19, 4, 0, 0, 0))
  })
})

describe('moveErrorMessage', () => {
  it('explains a full Today without a count of what is waiting', () => {
    expect(moveErrorMessage({ message: 'today_full' })).toBe(
      'Today already has 3. Finish one or move one back to Later first.',
    )
  })

  it('explains the Fun slot', () => {
    expect(moveErrorMessage({ message: 'today_fun_full' })).toMatch(/fun task/i)
  })

  it('falls back to a plain connection message', () => {
    expect(moveErrorMessage(new TypeError('Failed to fetch'))).toMatch(/connection/i)
  })
})

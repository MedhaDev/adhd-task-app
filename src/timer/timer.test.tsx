import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ saveSession: vi.fn(), fetchSessionsSince: vi.fn() }))
vi.mock('../data/timerSessions', () => api)
vi.mock('../lib/supabase', () => ({ supabase: {} }))

const { useTimer } = await import('./useTimer')
const { TimerView } = await import('./TimerView')

const target = { taskId: 'task-1', taskTitle: 'Apply to 1 role', stepId: 'step-1', stepBody: 'open saved jobs' }
const onFinish = vi.fn()

function Harness() {
  const timer = useTimer()
  return (
    <>
      <button onClick={() => timer.start(target)}>start</button>
      <p data-testid="note">{timer.note}</p>
      <p data-testid="minutes">{timer.minutesToday}</p>
      <TimerView timer={timer} onFinishTask={onFinish} />
    </>
  )
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

function savedOutcomes() {
  return api.saveSession.mock.calls.map(([s]) => `${s.kind}:${s.outcome ?? 'running'}`)
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-11-19T10:00:00Z') })
  api.saveSession.mockReset().mockResolvedValue(undefined)
  api.fetchSessionsSince.mockReset().mockResolvedValue([])
  window.localStorage.clear()
  document.title = 'Today'
})

afterEach(() => {
  vi.useRealTimers()
})

describe('timer', () => {
  it('runs 5 minutes, then offers to keep going', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('start'))
    expect(screen.getByRole('timer')).toHaveTextContent('5:00')
    expect(document.title).toBe('5:00 · Apply to 1 role')

    await advance(2 * 60_000 + 30_000)
    expect(screen.getByRole('timer')).toHaveTextContent('2:30')

    await advance(3 * 60_000)
    expect(screen.getByText(/5 minutes done/i)).toBeInTheDocument()
    expect(document.title).toBe("Time's up · Apply to 1 role")

    fireEvent.click(screen.getByRole('button', { name: /keep going 25 min/i }))
    expect(screen.getByRole('timer')).toHaveTextContent('25:00')
    expect(savedOutcomes()).toEqual(['starter:running', 'starter:kept_going', 'focus:running'])
  })

  it('treats stopping a starter as a win', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('start'))
    await advance(60_000)
    fireEvent.click(screen.getByRole('button', { name: /^stop$/i }))
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByTestId('note')).toHaveTextContent('You started. That counts.')
    expect(savedOutcomes()).toEqual(['starter:running', 'starter:stopped'])
    expect(screen.getByTestId('minutes')).toHaveTextContent('1')
  })

  it('offers a break after a focus round, then another round', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('start'))
    await advance(5 * 60_000)
    fireEvent.click(screen.getByRole('button', { name: /keep going 15 min/i }))
    await advance(15 * 60_000)
    fireEvent.click(screen.getByRole('button', { name: /take a break/i }))
    expect(screen.getByText(/not your phone/i)).toBeInTheDocument()
    await advance(5 * 60_000)
    expect(screen.getByText(/break's over/i)).toBeInTheDocument()
    expect(screen.getByTestId('minutes')).toHaveTextContent('20')
  })

  it('picks up where it was after a reload', async () => {
    const first = render(<Harness />)
    fireEvent.click(screen.getByText('start'))
    first.unmount()
    await advance(2 * 60_000)
    render(<Harness />)
    expect(screen.getByRole('timer')).toHaveTextContent('3:00')
  })

  it('closes a timer that was left behind long ago as abandoned', async () => {
    const first = render(<Harness />)
    fireEvent.click(screen.getByText('start'))
    first.unmount()
    await advance(60 * 60_000)
    render(<Harness />)
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(savedOutcomes()).toContain('starter:abandoned')
  })

  it('keeps running and says so if saving fails', async () => {
    api.saveSession.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<Harness />)
    fireEvent.click(screen.getByText('start'))
    await advance(1000)
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't save this timer yet/i)
    expect(screen.getByRole('timer')).toBeInTheDocument()
  })
})

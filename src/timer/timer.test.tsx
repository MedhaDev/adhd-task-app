import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ saveSession: vi.fn(), fetchSessionsSince: vi.fn() }))
vi.mock('../data/timerSessions', () => api)
vi.mock('../lib/supabase', () => ({ supabase: {} }))
const parkedApi = vi.hoisted(() => ({
  fetchUnresolvedParked: vi.fn(),
  insertParked: vi.fn(),
  resolveParked: vi.fn(),
}))
vi.mock('../data/parked', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/parked')>()),
  ...parkedApi,
}))
const tasksApi = vi.hoisted(() => ({ insertTask: vi.fn() }))
vi.mock('../data/tasks', () => tasksApi)

const { useTimer } = await import('./useTimer')
const { useParkingLot } = await import('../data/useParkingLot')
const { parkedOutbox } = await import('../data/parked')
const { outbox: taskOutbox } = await import('../data/outbox')
const { TimerView } = await import('./TimerView')

const target = { taskId: 'task-1', taskTitle: 'Apply to 1 role', stepId: 'step-1', stepBody: 'open saved jobs' }
const onFinish = vi.fn()

function Harness() {
  const timer = useTimer()
  const lot = useParkingLot()
  return (
    <>
      <button onClick={() => timer.start(target)}>start</button>
      <p data-testid="note">{timer.note}</p>
      <p data-testid="minutes">{timer.minutesToday}</p>
      <TimerView timer={timer} lot={lot} onFinishTask={onFinish} />
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
  parkedOutbox.write([])
  taskOutbox.list().forEach((t) => taskOutbox.remove(t.id))
  parkedApi.fetchUnresolvedParked.mockReset().mockResolvedValue([])
  parkedApi.insertParked.mockReset().mockResolvedValue(undefined)
  parkedApi.resolveParked.mockReset().mockResolvedValue(undefined)
  tasksApi.insertTask.mockReset().mockResolvedValue(undefined)
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

  describe('parking lot', () => {
    function park(text: string) {
      const input = screen.getByRole('textbox', { name: /park a thought/i })
      fireEvent.change(input, { target: { value: text } })
      fireEvent.submit(input)
    }

    it('catches a thought, hides it, and saves it with the timer', async () => {
      render(<Harness />)
      fireEvent.click(screen.getByText('start'))
      await advance(1000)
      park('reply to recruiter')
      expect(screen.getByRole('textbox', { name: /park a thought/i })).toHaveValue('')
      expect(screen.getByText('Parked. Back to it.')).toBeInTheDocument()
      expect(screen.queryByText('reply to recruiter')).not.toBeInTheDocument()
      const saved = parkedApi.insertParked.mock.calls[0][0]
      expect(saved.body).toBe('reply to recruiter')
      expect(saved.sessionId).toBe(api.saveSession.mock.calls[0][0].id)
    })

    it('shows parked thoughts when time is up, to keep or delete', async () => {
      render(<Harness />)
      fireEvent.click(screen.getByText('start'))
      await advance(1000)
      park('reply to recruiter')
      park('what was that movie')
      await advance(5 * 60_000)
      expect(screen.getByText('reply to recruiter')).toBeInTheDocument()

      fireEvent.click(screen.getAllByRole('button', { name: /keep in later/i })[0])
      await advance(0)
      expect(tasksApi.insertTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'reply to recruiter' }))
      expect(parkedApi.resolveParked).toHaveBeenCalledWith(expect.any(String), 'kept')

      fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
      await advance(0)
      expect(parkedApi.resolveParked).toHaveBeenLastCalledWith(expect.any(String), 'deleted')
      expect(screen.queryByText('what was that movie')).not.toBeInTheDocument()
    })

    it('keeps a parked thought on the device if saving fails', async () => {
      parkedApi.insertParked.mockRejectedValue(new TypeError('Failed to fetch'))
      render(<Harness />)
      fireEvent.click(screen.getByText('start'))
      await advance(1000)
      park('reply to recruiter')
      await advance(0)
      expect(parkedOutbox.list().map((p) => p.body)).toEqual(['reply to recruiter'])
    })

    it('a kept thought is safe in Later even if saving the task fails', async () => {
      tasksApi.insertTask.mockRejectedValue(new TypeError('Failed to fetch'))
      render(<Harness />)
      fireEvent.click(screen.getByText('start'))
      await advance(1000)
      park('reply to recruiter')
      await advance(5 * 60_000)
      fireEvent.click(screen.getByRole('button', { name: /keep in later/i }))
      await advance(0)
      expect(taskOutbox.list().map((t) => t.title)).toEqual(['reply to recruiter'])
      expect(screen.getByRole('alert')).toHaveTextContent(/kept on this device/i)
    })

    it('press P to jump to the park box', async () => {
      render(<Harness />)
      fireEvent.click(screen.getByText('start'))
      fireEvent.keyDown(window, { key: 'p' })
      expect(screen.getByRole('textbox', { name: /park a thought/i })).toHaveFocus()
    })
  })
})

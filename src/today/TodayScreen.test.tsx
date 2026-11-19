import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  resetToday: vi.fn(),
  fetchToday: vi.fn(),
  finishTask: vi.fn(),
  startHere: vi.fn(),
  sendBackToLater: vi.fn(),
  setStepDone: vi.fn(),
  addStep: vi.fn(),
}))
vi.mock('../data/today', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/today')>()),
  ...api,
}))
vi.mock('../lib/supabase', () => ({ supabase: {} }))

const { TodayScreen } = await import('./TodayScreen')

const step = (body: string) => ({ id: `s-${body}`, body, position: 0, done_at: null })
const active = [
  { id: 'a', title: 'Apply to 1 data analyst role', area: 'job_search', today_position: 0, steps: [step('open saved jobs')] },
  { id: 'b', title: 'Clean survey data', area: 'work', today_position: 1, steps: [step('open the file')] },
]

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset())
  api.resetToday.mockResolvedValue(undefined)
  api.fetchToday.mockResolvedValue({ active, done: [{ id: 'd', title: 'Reply to recruiter', finished_at: 'x' }] })
  api.finishTask.mockResolvedValue(undefined)
  api.startHere.mockResolvedValue(undefined)
  api.sendBackToLater.mockResolvedValue(undefined)
  api.setStepDone.mockResolvedValue(undefined)
  api.addStep.mockResolvedValue(undefined)
})

describe('TodayScreen', () => {
  it('puts one task on top with its first step', async () => {
    render(<TodayScreen />)
    expect(await screen.findByRole('heading', { name: /apply to 1 data analyst role/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /open saved jobs/i })).not.toBeChecked()
    expect(screen.getByText('Clean survey data')).toBeInTheDocument()
  })

  it('resets yesterday before loading', async () => {
    render(<TodayScreen />)
    await screen.findByText('Clean survey data')
    expect(api.resetToday).toHaveBeenCalledBefore(api.fetchToday)
  })

  it('shows what was done today', async () => {
    render(<TodayScreen />)
    expect(await screen.findByText('Reply to recruiter')).toBeInTheDocument()
  })

  it('marks a task done', async () => {
    render(<TodayScreen />)
    await screen.findByText('Clean survey data')
    fireEvent.click(screen.getAllByRole('button', { name: /^done$/i })[0])
    await waitFor(() => expect(api.finishTask).toHaveBeenCalledWith('a'))
  })

  it('moves another task to the top', async () => {
    render(<TodayScreen />)
    await screen.findByText('Clean survey data')
    fireEvent.click(screen.getByRole('button', { name: /start here/i }))
    await waitFor(() => expect(api.startHere).toHaveBeenCalledWith('b'))
  })

  it('says so visibly when an action fails', async () => {
    api.finishTask.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<TodayScreen />)
    await screen.findByText('Clean survey data')
    fireEvent.click(screen.getAllByRole('button', { name: /^done$/i })[0])
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't mark/i)
  })

  it('points to Later when Today is empty', async () => {
    api.fetchToday.mockResolvedValue({ active: [], done: [] })
    render(<TodayScreen />)
    expect(await screen.findByRole('link', { name: /pick up to 3 from later/i })).toBeInTheDocument()
  })

  it('never shows a count of tasks waiting', async () => {
    render(<TodayScreen />)
    await screen.findByText('Clean survey data')
    expect(screen.queryByText(/\b\d+\s+(tasks?|left|remaining)\b/i)).not.toBeInTheDocument()
  })

  it('ticks a step and fills the progress line', async () => {
    render(<TodayScreen />)
    const box = await screen.findByRole('checkbox', { name: /open saved jobs/i })
    fireEvent.click(box)
    expect(box).toBeChecked()
    expect(screen.getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '1')
    await waitFor(() => expect(api.setStepDone).toHaveBeenCalledWith('s-open saved jobs', true))
  })

  it('un-ticks the step and says so if saving the tick fails', async () => {
    api.setStepDone.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<TodayScreen />)
    const box = await screen.findByRole('checkbox', { name: /open saved jobs/i })
    fireEvent.click(box)
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't save the tick/i)
    expect(box).not.toBeChecked()
  })

  it('adds the next step with Enter', async () => {
    render(<TodayScreen />)
    const input = await screen.findByRole('textbox', { name: /add a step/i })
    fireEvent.change(input, { target: { value: 'pick one posting' } })
    fireEvent.submit(input)
    expect(await screen.findByRole('checkbox', { name: /pick one posting/i })).toBeInTheDocument()
    await waitFor(() =>
      expect(api.addStep).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 'a', body: 'pick one posting', position: 1 }),
      ),
    )
    expect(input).toHaveValue('')
  })

  it('keeps the typed step in the box if it could not be saved', async () => {
    api.addStep.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<TodayScreen />)
    const input = await screen.findByRole('textbox', { name: /add a step/i })
    fireEvent.change(input, { target: { value: 'pick one posting' } })
    fireEvent.submit(input)
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't add the step/i)
    await waitFor(() => expect(input).toHaveValue('pick one posting'))
    expect(screen.queryByRole('checkbox', { name: /pick one posting/i })).not.toBeInTheDocument()
  })

  it('shows where to pick up the other tasks', async () => {
    render(<TodayScreen />)
    expect(await screen.findByText(/next: open the file/i)).toBeInTheDocument()
  })
})

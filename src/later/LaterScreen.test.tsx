import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { outbox } from '../data/outbox'

const api = vi.hoisted(() => ({
  fetchLaterTasks: vi.fn(),
  insertTask: vi.fn(),
  updateTaskArea: vi.fn(),
  deleteTask: vi.fn(),
}))
vi.mock('../data/tasks', () => api)

const { LaterScreen } = await import('./LaterScreen')

const saved = [
  { id: 't1', title: 'Clean survey data', area: 'work', status: 'later', created_at: '2026-11-18T10:00:00Z' },
  { id: 't2', title: 'Do laundry', area: 'personal', status: 'later', created_at: '2026-11-18T09:00:00Z' },
]

function addTask(title: string) {
  fireEvent.change(screen.getByRole('textbox', { name: /new task/i }), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: /add to later/i }))
}

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset())
  api.fetchLaterTasks.mockResolvedValue(saved)
  api.insertTask.mockResolvedValue(undefined)
  api.deleteTask.mockResolvedValue(undefined)
  api.updateTaskArea.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
  outbox.list().forEach((p) => outbox.remove(p.id))
})

describe('LaterScreen', () => {
  it('lists saved tasks and never shows how many there are', async () => {
    render(<LaterScreen />)
    expect(await screen.findByText('Clean survey data')).toBeInTheDocument()
    expect(screen.getByText('Do laundry')).toBeInTheDocument()
    expect(screen.queryByText(/\b\d+\s+(tasks?|items?)\b/i)).not.toBeInTheDocument()
  })

  it('adds a task with the chosen area and saves it', async () => {
    render(<LaterScreen />)
    await screen.findByText('Clean survey data')
    fireEvent.click(within(screen.getByRole('group', { name: /area for new tasks/i })).getByText('Job search'))
    addTask('Send 1 cold email')

    expect(screen.getByText('Send 1 cold email')).toBeInTheDocument()
    await waitFor(() =>
      expect(api.insertTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Send 1 cold email', area: 'job_search' }),
      ),
    )
    await waitFor(() => expect(screen.queryByText(/saving/i)).not.toBeInTheDocument())
    expect(outbox.list()).toHaveLength(0)
  })

  it('keeps a task that failed to save, says so, and retries', async () => {
    api.insertTask.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<LaterScreen />)
    await screen.findByText('Clean survey data')
    addTask('Apply to 1 role')

    expect(await screen.findByText(/couldn't save this yet/i)).toBeInTheDocument()
    expect(screen.getByText('Apply to 1 role')).toBeInTheDocument()
    expect(outbox.list().map((p) => p.title)).toEqual(['Apply to 1 role'])

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(screen.queryByText(/couldn't save this yet/i)).not.toBeInTheDocument())
    expect(api.insertTask).toHaveBeenCalledTimes(2)
    // Same id both times, so a retry can't create a duplicate.
    expect(api.insertTask.mock.calls[0][0].id).toBe(api.insertTask.mock.calls[1][0].id)
    expect(outbox.list()).toHaveLength(0)
  })

  it('retries tasks left on the device from last time', async () => {
    outbox.add({ id: 'left', title: 'Left over', area: null, createdAt: '2026-11-18T11:00:00Z' })
    render(<LaterScreen />)
    expect(await screen.findByText('Left over')).toBeInTheDocument()
    await waitFor(() => expect(api.insertTask).toHaveBeenCalledWith({ id: 'left', title: 'Left over', area: null }))
  })

  it('shows tasks waiting on the device even when loading fails', async () => {
    api.fetchLaterTasks.mockRejectedValue(new TypeError('Failed to fetch'))
    outbox.add({ id: 'w', title: 'Waiting task', area: null, createdAt: '2026-11-18T11:00:00Z' })
    render(<LaterScreen />)
    expect(await screen.findByText(/couldn't load your later list/i)).toBeInTheDocument()
    expect(screen.getByText('Waiting task')).toBeInTheDocument()
  })

  it('filters by area', async () => {
    render(<LaterScreen />)
    await screen.findByText('Clean survey data')
    fireEvent.click(within(screen.getByRole('group', { name: /^show$/i })).getByText('Personal'))
    expect(screen.queryByText('Clean survey data')).not.toBeInTheDocument()
    expect(screen.getByText('Do laundry')).toBeInTheDocument()
  })

  it('lets you undo a delete', async () => {
    render(<LaterScreen />)
    await screen.findByText('Do laundry')
    fireEvent.click(screen.getByRole('button', { name: /delete "do laundry"/i }))
    expect(screen.queryByText('Do laundry')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(screen.getByText('Do laundry')).toBeInTheDocument()
    expect(api.deleteTask).not.toHaveBeenCalled()
  })

  it('deletes for real after the undo window', async () => {
    render(<LaterScreen />)
    await screen.findByText('Do laundry')
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: /delete "do laundry"/i }))
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(api.deleteTask).toHaveBeenCalledWith('t2')
  })

  it('jumps to the add box when you press N', async () => {
    render(<LaterScreen />)
    await screen.findByText('Clean survey data')
    fireEvent.keyDown(window, { key: 'n' })
    expect(screen.getByRole('textbox', { name: /new task/i })).toHaveFocus()
  })
})

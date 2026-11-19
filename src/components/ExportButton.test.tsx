import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ fetchAllEvents: vi.fn() }))
vi.mock('../data/exportCsv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/exportCsv')>()),
  ...api,
}))
vi.mock('../lib/supabase', () => ({ supabase: {} }))

const { ExportButton } = await import('./ExportButton')

beforeEach(() => {
  api.fetchAllEvents.mockReset()
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
})

describe('ExportButton', () => {
  it('downloads a dated CSV of all events', async () => {
    api.fetchAllEvents.mockResolvedValue([
      { occurred_at: '2026-11-19T10:00:00Z', name: 'task_added', task_id: 't1', details: {}, tasks: { title: 'A' } },
    ])
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<ExportButton />)
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }))
    expect(await screen.findByText('Downloaded')).toBeInTheDocument()
    expect(click).toHaveBeenCalled()
    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blob)
    })
    expect(text).toContain('occurred_at_utc,day,local_time')
    expect(text).toContain('task_added')
  })

  it('says so visibly if the download fails', async () => {
    api.fetchAllEvents.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<ExportButton />)
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't download your data/i)
  })
})

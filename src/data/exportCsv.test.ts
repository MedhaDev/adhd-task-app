import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))
const { CSV_COLUMNS, csvCell, eventsToRows, exportFileName, toCsv } = await import('./exportCsv')

const col = (name: (typeof CSV_COLUMNS)[number]) => CSV_COLUMNS.indexOf(name)

describe('csvCell', () => {
  it('leaves plain text alone', () => {
    expect(csvCell('task_added')).toBe('task_added')
  })

  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('Laundry, then dishes')).toBe('"Laundry, then dishes"')
    expect(csvCell('Say "hi"')).toBe('"Say ""hi"""')
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"')
  })

  it('stops a task title from running as a spreadsheet formula', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('@everyone')).toBe("'@everyone")
  })

  it('keeps negative numbers as numbers', () => {
    expect(csvCell('-1.5')).toBe('-1.5')
  })
})

describe('eventsToRows', () => {
  const lateNight = new Date(2026, 10, 19, 2, 15, 0).toISOString()

  it('flattens the details into their own columns', () => {
    const [row] = eventsToRows([
      {
        occurred_at: lateNight,
        name: 'timer_ended',
        task_id: 't1',
        details: { kind: 'starter', outcome: 'kept_going', minutes: 5 },
        tasks: { title: 'Apply to 1 role' },
      },
    ])
    expect(row[col('event')]).toBe('timer_ended')
    expect(row[col('task_title')]).toBe('Apply to 1 role')
    expect(row[col('kind')]).toBe('starter')
    expect(row[col('outcome')]).toBe('kept_going')
    expect(row[col('minutes')]).toBe('5')
    expect(row[col('area')]).toBe('')
    expect(row).toHaveLength(CSV_COLUMNS.length)
  })

  it('uses the 4am rule for the day column', () => {
    const [row] = eventsToRows([{ occurred_at: lateNight, name: 'task_added', task_id: null, details: {}, tasks: null }])
    expect(row[col('day')]).toBe('2026-11-18')
    expect(row[col('local_time')]).toBe('02:15:00')
  })

  it('keeps the id of a deleted task from its details', () => {
    const [row] = eventsToRows([
      { occurred_at: lateNight, name: 'task_deleted', task_id: null, details: { task_id: 'gone-1' }, tasks: null },
    ])
    expect(row[col('task_id')]).toBe('gone-1')
  })
})

describe('toCsv', () => {
  it('writes a header and one line per event', () => {
    const csv = toCsv(['a', 'b'], [['1', 'x, y']])
    expect(csv).toBe('a,b\r\n1,"x, y"\r\n')
  })
})

describe('exportFileName', () => {
  it('includes the date', () => {
    expect(exportFileName(new Date(2026, 10, 19))).toBe('today-events-2026-11-19.csv')
  })
})

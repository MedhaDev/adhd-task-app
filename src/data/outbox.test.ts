import { afterEach, describe, expect, it, vi } from 'vitest'
import { outbox } from './outbox'

const task = (id: string) => ({ id, title: `Task ${id}`, area: null, createdAt: '2026-11-19T00:00:00Z' })

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  outbox.list().forEach((p) => outbox.remove(p.id))
})

describe('outbox', () => {
  it('keeps tasks until they are removed', () => {
    outbox.add(task('a'))
    outbox.add(task('b'))
    expect(outbox.list().map((p) => p.id)).toEqual(['b', 'a'])
    outbox.remove('a')
    expect(outbox.list().map((p) => p.id)).toEqual(['b'])
  })

  it('survives a page reload (stored on the device)', () => {
    outbox.add(task('a'))
    expect(JSON.parse(window.localStorage.getItem('today.outbox') ?? '[]')).toHaveLength(1)
  })

  it('still holds tasks in memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    outbox.add(task('a'))
    expect(outbox.list().map((p) => p.id)).toEqual(['a'])
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { themes } from './palette'
import { applyVibe, DEFAULT_VIBE, readStoredVibe } from './vibe'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('readStoredVibe', () => {
  it('defaults to loud when nothing is stored', () => {
    expect(readStoredVibe()).toBe(DEFAULT_VIBE)
  })

  it('returns the stored vibe', () => {
    window.localStorage.setItem('today.vibe', 'calm')
    expect(readStoredVibe()).toBe('calm')
  })

  it('ignores unknown values', () => {
    window.localStorage.setItem('today.vibe', 'chaos')
    expect(readStoredVibe()).toBe(DEFAULT_VIBE)
  })

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredVibe()).toBe(DEFAULT_VIBE)
  })
})

describe('applyVibe', () => {
  it('writes the theme colors onto the page', () => {
    const root = document.createElement('div')
    applyVibe('calm', root)
    expect(root.style.getPropertyValue('--bg')).toBe(themes.calm.bg)
    expect(root.style.getPropertyValue('--text')).toBe(themes.calm.text)
    expect(root.dataset.vibe).toBe('calm')
  })
})

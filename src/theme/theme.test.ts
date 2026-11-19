import { afterEach, describe, expect, it, vi } from 'vitest'
import { themes } from './palette'
import { applyTheme, currentMode } from './theme'

afterEach(() => {
  vi.unstubAllGlobals()
})

function fakeDarkSetting(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    addEventListener: () => {},
  }))
}

describe('currentMode', () => {
  it('uses paper when the device is in light mode', () => {
    fakeDarkSetting(false)
    expect(currentMode()).toBe('paper')
  })

  it('uses carbon when the device is in dark mode', () => {
    fakeDarkSetting(true)
    expect(currentMode()).toBe('carbon')
  })
})

describe('applyTheme', () => {
  it('writes the colors onto the page', () => {
    const root = document.createElement('div')
    applyTheme('carbon', root)
    expect(root.style.getPropertyValue('--bg')).toBe(themes.carbon.bg)
    expect(root.style.getPropertyValue('--text')).toBe(themes.carbon.text)
    expect(root.dataset.mode).toBe('carbon')
  })
})

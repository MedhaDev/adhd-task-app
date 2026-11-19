import { describe, expect, it } from 'vitest'
import { contrastRatio, MODES, textPairs, themes } from './palette'

// WCAG AA for normal-size text.
const MIN_CONTRAST = 4.5

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for a color on itself', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#F4F0E6', '#F4F0E6')).toBeCloseTo(1, 5)
  })
})

describe.each(MODES)('%s mode', (mode) => {
  it.each(textPairs(themes[mode]))('%s is readable', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })
})

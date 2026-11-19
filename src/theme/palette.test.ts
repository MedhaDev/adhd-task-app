import { describe, expect, it } from 'vitest'
import { areaColors, colors, contrastRatio, textPairs, themes, VIBES } from './palette'

// WCAG AA for normal-size text.
const MIN_CONTRAST = 4.5

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for a color on itself', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio(colors.sky, colors.sky)).toBeCloseTo(1, 5)
  })
})

describe.each(VIBES)('%s vibe', (vibe) => {
  it.each(textPairs(themes[vibe]))('%s is readable', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })
})

describe('area cards', () => {
  it.each(Object.entries(areaColors))('%s card text is readable', (_area, { bg, ink }) => {
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })
})

/**
 * The one place colors are defined. The app reads these at runtime and the
 * contrast tests read the same values, so a color can't change without the
 * contrast check seeing it.
 *
 * Look: an old notebook. Paper and ink, thin ruled lines, one red margin line.
 * Dark mode ("carbon paper") follows the device setting, with nothing to choose.
 */
export type Mode = 'paper' | 'carbon'
export const MODES: readonly Mode[] = ['paper', 'carbon']

export type ThemeTokens = {
  bg: string
  text: string
  muted: string
  rule: string
  margin: string
}

export const themes: Record<Mode, ThemeTokens> = {
  paper: {
    bg: '#F4F0E6',
    text: '#222120',
    muted: '#5E5A52',
    rule: '#CFC7B6',
    margin: '#B23A2E',
  },
  carbon: {
    bg: '#1C1B19',
    text: '#E8E2D4',
    muted: '#A8A194',
    rule: '#3A3732',
    margin: '#D9675A',
  },
}

/** Every text-on-background pairing, for the contrast check. */
export function textPairs(t: ThemeTokens): Array<[label: string, fg: string, bg: string]> {
  return [
    ['text on paper', t.text, t.bg],
    ['muted text on paper', t.muted, t.bg],
    ['red marks on paper', t.margin, t.bg],
  ]
}

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two colors, from 1 (none) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

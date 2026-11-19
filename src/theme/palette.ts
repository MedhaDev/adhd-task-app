/**
 * The one place colors are defined. The app reads these at runtime and the
 * contrast tests read the same values, so a color can't change without the
 * contrast check seeing it.
 */
export const colors = {
  mutedBlack: '#1D1D1B',
  seashell: '#EAE4DA',
  pinkQuartz: '#EAA7C7',
  sky: '#9ED6DF',
  mustard: '#EAC119',
  lavender: '#808BC5',
  tangerine: '#ED773C',
  tea: '#245E55',
  redPassion: '#C63F3E',
} as const

export type Vibe = 'loud' | 'calm'
export const VIBES: readonly Vibe[] = ['loud', 'calm']

export type ThemeTokens = {
  bg: string
  text: string
  accentOnBg: string
  panel: string
  onPanel: string
  button: string
  onButton: string
  field: string
  onField: string
  alert: string
  onAlert: string
}

const c = colors

export const themes: Record<Vibe, ThemeTokens> = {
  loud: {
    bg: c.mutedBlack,
    text: c.seashell,
    accentOnBg: c.pinkQuartz,
    panel: c.pinkQuartz,
    onPanel: c.mutedBlack,
    button: c.mutedBlack,
    onButton: c.pinkQuartz,
    field: c.seashell,
    onField: c.mutedBlack,
    alert: c.tangerine,
    onAlert: c.mutedBlack,
  },
  calm: {
    bg: c.seashell,
    text: c.mutedBlack,
    accentOnBg: c.mutedBlack,
    panel: c.mutedBlack,
    onPanel: c.seashell,
    button: c.pinkQuartz,
    onButton: c.mutedBlack,
    field: c.seashell,
    onField: c.mutedBlack,
    alert: c.tangerine,
    onAlert: c.mutedBlack,
  },
}

/** Each area's card color and the ink used on it (used from build step 2 on). */
export const areaColors = {
  work: { bg: c.sky, ink: c.mutedBlack },
  job_search: { bg: c.pinkQuartz, ink: c.mutedBlack },
  personal: { bg: c.mustard, ink: c.mutedBlack },
  fun: { bg: c.tangerine, ink: c.mutedBlack },
} as const

/** Every text-on-background pairing a theme uses, for the contrast check. */
export function textPairs(t: ThemeTokens): Array<[label: string, fg: string, bg: string]> {
  return [
    ['text on page', t.text, t.bg],
    ['accent on page', t.accentOnBg, t.bg],
    ['text on panel', t.onPanel, t.panel],
    ['button text', t.onButton, t.button],
    ['field text', t.onField, t.field],
    ['alert text', t.onAlert, t.alert],
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

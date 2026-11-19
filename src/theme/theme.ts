import { themes, type Mode, type ThemeTokens } from './palette'

const TOKEN_TO_CSS: Record<keyof ThemeTokens, string> = {
  bg: '--bg',
  text: '--text',
  muted: '--muted',
  rule: '--rule',
  margin: '--margin',
}

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)')

export function currentMode(): Mode {
  return darkQuery()?.matches ? 'carbon' : 'paper'
}

/** Writes the mode's colors onto the page as CSS variables. */
export function applyTheme(mode: Mode, root: HTMLElement = document.documentElement): void {
  const tokens = themes[mode]
  for (const key of Object.keys(TOKEN_TO_CSS) as Array<keyof ThemeTokens>) {
    root.style.setProperty(TOKEN_TO_CSS[key], tokens[key])
  }
  root.dataset.mode = mode
  root.style.colorScheme = mode === 'carbon' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg)
}

/** Paints the right mode now and follows the device if it switches light/dark. */
export function startTheme(): void {
  applyTheme(currentMode())
  darkQuery()?.addEventListener?.('change', () => applyTheme(currentMode()))
}

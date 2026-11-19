import { useCallback, useState } from 'react'
import { themes, VIBES, type Vibe } from './palette'

const STORAGE_KEY = 'today.vibe'
export const DEFAULT_VIBE: Vibe = 'loud'

/** Reads the last vibe used on this device. Storage can be blocked, so never throw. */
export function readStoredVibe(): Vibe {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return VIBES.includes(value as Vibe) ? (value as Vibe) : DEFAULT_VIBE
  } catch {
    return DEFAULT_VIBE
  }
}

function storeVibe(vibe: Vibe): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, vibe)
  } catch {
    // Not remembering the vibe is fine; the app still works.
  }
}

const TOKEN_TO_CSS: Record<keyof (typeof themes)['loud'], string> = {
  bg: '--bg',
  text: '--text',
  accentOnBg: '--accent-on-bg',
  panel: '--panel',
  onPanel: '--on-panel',
  button: '--button',
  onButton: '--on-button',
  field: '--field',
  onField: '--on-field',
  alert: '--alert',
  onAlert: '--on-alert',
}

/** Writes the vibe's colors onto the page as CSS variables. */
export function applyVibe(vibe: Vibe, root: HTMLElement = document.documentElement): void {
  const tokens = themes[vibe]
  for (const key of Object.keys(TOKEN_TO_CSS) as Array<keyof typeof TOKEN_TO_CSS>) {
    root.style.setProperty(TOKEN_TO_CSS[key], tokens[key])
  }
  root.dataset.vibe = vibe
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg)
}

export function useVibe(): [Vibe, () => void] {
  const [vibe, setVibe] = useState<Vibe>(readStoredVibe)

  const toggle = useCallback(() => {
    setVibe((current) => {
      const next: Vibe = current === 'loud' ? 'calm' : 'loud'
      applyVibe(next)
      storeVibe(next)
      return next
    })
  }, [])

  return [vibe, toggle]
}

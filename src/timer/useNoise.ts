import { useCallback, useEffect, useRef, useState } from 'react'
import { NoisePlayer, noiseSupported, type NoiseKind } from './noise'

export type NoisePrefs = { kind: NoiseKind | 'off'; volume: number }

const KEY = 'today.noise'
const DEFAULT_PREFS: NoisePrefs = { kind: 'off', volume: 0.4 }

function readPrefs(): NoisePrefs {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<NoisePrefs>
    const kind = parsed.kind === 'brown' || parsed.kind === 'white' ? parsed.kind : 'off'
    const volume = typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : DEFAULT_PREFS.volume
    return { kind, volume }
  } catch {
    return DEFAULT_PREFS
  }
}

function writePrefs(prefs: NoisePrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Fine: the choice just won't be remembered on this device.
  }
}

/**
 * Noise plays only while `shouldPlay` (a running starter or focus round).
 * When time is up it fades out, so the quiet itself says "time's up".
 * The choice is remembered on this device.
 */
export function useNoise(shouldPlay: boolean) {
  const [prefs, setPrefs] = useState<NoisePrefs>(readPrefs)
  const player = useRef<NoisePlayer | null>(null)

  useEffect(() => {
    player.current = new NoisePlayer()
    return () => player.current?.close()
  }, [])

  useEffect(() => {
    if (shouldPlay && prefs.kind !== 'off') player.current?.start(prefs.kind, prefs.volume)
    else player.current?.stop()
  }, [shouldPlay, prefs.kind, prefs.volume])

  const update = useCallback((change: Partial<NoisePrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...change }
      writePrefs(next)
      return next
    })
  }, [])

  return {
    supported: noiseSupported(),
    kind: prefs.kind,
    volume: prefs.volume,
    setKind: (kind: NoisePrefs['kind']) => update({ kind }),
    setVolume: (volume: number) => update({ volume }),
  }
}

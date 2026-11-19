import type { useNoise } from './useNoise'

type Noise = ReturnType<typeof useNoise>

const OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'brown', label: 'Brown' },
  { value: 'white', label: 'White' },
] as const

/** Plain words to pick a background sound, plus a volume line when it's on. */
export function NoiseControls({ noise }: { noise: Noise }) {
  if (!noise.supported) return null
  return (
    <div className="noise">
      <div className="chips" role="group" aria-label="Background noise">
        <span className="label noise-label">Noise</span>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="chip label"
            aria-pressed={noise.kind === option.value}
            onClick={() => noise.setKind(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {noise.kind !== 'off' ? (
        <label className="noise-volume">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={noise.volume}
            onChange={(e) => noise.setVolume(Number(e.target.value))}
          />
        </label>
      ) : null}
    </div>
  )
}

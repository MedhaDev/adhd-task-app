import type { Vibe } from '../theme/palette'

type Props = { vibe: Vibe; onToggle: () => void }

/** The one design switch: Calm or Loud. Remembered on this device. */
export function VibeToggle({ vibe, onToggle }: Props) {
  return (
    <button
      type="button"
      className="vibe-toggle label"
      onClick={onToggle}
      aria-label={`Vibe: ${vibe}. Switch to ${vibe === 'loud' ? 'calm' : 'loud'}`}
    >
      <span aria-hidden="true" className={vibe === 'calm' ? 'is-on' : undefined}>
        calm
      </span>
      <span aria-hidden="true"> / </span>
      <span aria-hidden="true" className={vibe === 'loud' ? 'is-on' : undefined}>
        loud
      </span>
    </button>
  )
}

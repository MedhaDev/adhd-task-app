import { AREA_LABELS, AREAS, type Area } from '../data/areas'

type Props = {
  value: Area | null
  onChange: (area: Area | null) => void
  label: string
}

/** One tap to pick an area; tap the chosen one again to clear it. */
export function AreaChips({ value, onChange, label }: Props) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {AREAS.map((area) => (
        <button
          key={area}
          type="button"
          className="chip label"
          data-area={area}
          aria-pressed={value === area}
          onClick={() => onChange(value === area ? null : area)}
        >
          {AREA_LABELS[area]}
        </button>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert } from '../components/Alert'
import type { useParkingLot } from '../data/useParkingLot'

type Lot = ReturnType<typeof useParkingLot>

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * During a timer: catch a stray thought in one line, so it stops pulling at you.
 * It disappears from view right away; you decide what to do with it afterwards.
 */
export function ParkBox({ lot, sessionId }: { lot: Lot; sessionId: string | null }) {
  const [draft, setDraft] = useState('')
  const [confirm, setConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Press P to park a thought without touching the mouse.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'p' || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!confirm) return
    const id = window.setTimeout(() => setConfirm(false), 2500)
    return () => window.clearTimeout(id)
  }, [confirm])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    lot.park(draft, sessionId)
    setDraft('')
    setConfirm(true)
    inputRef.current?.blur()
  }

  return (
    <form className="park" onSubmit={submit}>
      <label className="field-label">
        <span className="label">Park a thought · press P · Enter to park</span>
        <input
          ref={inputRef}
          className="field"
          type="text"
          autoComplete="off"
          maxLength={500}
          placeholder="Reply to that email"
          aria-label="Park a thought"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <p className="muted park-confirm" aria-live="polite">
        {confirm ? 'Parked. Back to it.' : ''}
      </p>
    </form>
  )
}

/** After the timer: keep each parked thought as a task in Later, or let it go. */
export function ParkedReview({ lot }: { lot: Lot }) {
  if (lot.items.length === 0 && !lot.error) return null
  return (
    <section className="parked-review" aria-label="Parked thoughts">
      <span className="label">Parked while you worked</span>
      {lot.error ? (
        <Alert
          action={
            <button type="button" className="link-button" onClick={lot.dismissError}>
              OK
            </button>
          }
        >
          {lot.error}
        </Alert>
      ) : null}
      <ul className="task-list">
        {lot.items.map((item) => (
          <li key={item.id} className="task-row">
            <p className="task-title">{item.body}</p>
            <div className="actions">
              <button type="button" className="link-button label" onClick={() => void lot.keep(item)}>
                Keep in Later
              </button>
              <button type="button" className="link-button label" onClick={() => void lot.discard(item)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

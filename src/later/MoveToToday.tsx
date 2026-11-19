import { useState, type FormEvent } from 'react'
import { Alert } from '../components/Alert'
import { moveErrorMessage, moveToToday } from '../data/today'

type Props = { taskId: string; title: string; onMoved: () => void; onCancel: () => void }

/** Moving into Today asks one question: what's the very first 2-minute step? */
export function MoveToToday({ taskId, title, onMoved, onCancel }: Props) {
  const [step, setStep] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!step.trim()) {
      setError("Write the first tiny step, even if it's small.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await moveToToday(taskId, step.trim())
      onMoved()
    } catch (caught) {
      setError(moveErrorMessage(caught))
      setBusy(false)
    }
  }

  return (
    <form className="move-form" onSubmit={submit} noValidate>
      <label className="field-label">
        <span className="label">What's the very first 2-minute step?</span>
        <input
          className="field"
          type="text"
          autoFocus
          autoComplete="off"
          maxLength={500}
          placeholder="Open the job posting"
          aria-label={`First step for "${title}"`}
          value={step}
          onChange={(e) => {
            setStep(e.target.value)
            if (error) setError(null)
          }}
        />
      </label>
      {error ? <Alert>{error}</Alert> : null}
      <div className="actions">
        <button className="button" type="submit" aria-busy={busy} disabled={busy}>
          {busy ? 'Moving…' : 'Move to Today'}
        </button>
        <button className="link-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

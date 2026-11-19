import { useState, type FormEvent } from 'react'
import { progress, type Step } from '../data/today'

/** A thin ruled line that fills as steps are ticked. */
export function ProgressLine({ steps }: { steps: Step[] }) {
  const { done, total } = progress(steps)
  if (total === 0) return null
  return (
    <div className="progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Steps done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="progress-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="label">
        {done} of {total} {total === 1 ? 'step' : 'steps'}
      </span>
    </div>
  )
}

type Props = {
  steps: Step[]
  onToggle: (step: Step) => void
  onAdd: (body: string) => Promise<boolean>
}

/** The open task's steps: tick them off, or add the next small one. */
export function StepList({ steps, onToggle, onAdd }: Props) {
  const [draft, setDraft] = useState('')
  const allDone = steps.length > 0 && steps.every((s) => s.done_at !== null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    const text = draft
    setDraft('')
    const saved = await onAdd(text)
    if (!saved) setDraft(text)
  }

  return (
    <div className="steps">
      <ProgressLine steps={steps} />
      <ul className="step-list">
        {steps.map((step) => (
          <li key={step.id}>
            <label className="step" data-done={step.done_at !== null}>
              <input type="checkbox" checked={step.done_at !== null} onChange={() => onToggle(step)} />
              <span className="step-text">{step.body}</span>
            </label>
          </li>
        ))}
      </ul>
      {allDone ? <p className="muted">Every step is ticked. Mark the task done when it feels done.</p> : null}
      <form onSubmit={submit}>
        <input
          className="field step-field"
          type="text"
          autoComplete="off"
          maxLength={500}
          placeholder="+ add the next small step"
          aria-label="Add a step"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </form>
    </div>
  )
}

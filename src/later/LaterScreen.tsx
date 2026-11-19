import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert } from '../components/Alert'
import { AREA_LABELS, AREAS, type Area } from '../data/areas'
import { useLaterTasks, type LaterItem } from '../data/useLaterTasks'
import { AreaChips } from './AreaChips'
import { MoveToToday } from './MoveToToday'

type Filter = Area | 'all'
const FILTER_KEY = 'today.laterFilter'

function readFilter(): Filter {
  try {
    const value = window.localStorage.getItem(FILTER_KEY)
    return value && (AREAS as readonly string[]).includes(value) ? (value as Area) : 'all'
  } catch {
    return 'all'
  }
}

function storeFilter(filter: Filter) {
  try {
    window.localStorage.setItem(FILTER_KEY, filter)
  } catch {
    // Fine: the filter just won't be remembered.
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function LaterScreen() {
  const later = useLaterTasks()
  const [draft, setDraft] = useState('')
  const [draftArea, setDraftArea] = useState<Area | null>(null)
  const [filter, setFilter] = useState<Filter>(readFilter)
  const [editingAreaFor, setEditingAreaFor] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Press N anywhere on this screen to start typing a new task.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    later.add(draft, draftArea)
    setDraft('')
    inputRef.current?.focus()
  }

  function chooseFilter(next: Filter) {
    setFilter(next)
    storeFilter(next)
  }

  const visible = later.items.filter((item) => filter === 'all' || item.area === filter)

  return (
    <section className="later" aria-labelledby="later-title">
      <h2 id="later-title" className="sr-only">
        Later
      </h2>

      <form className="dump" onSubmit={submit}>
        <label className="field-label">
          <span className="label">Brain dump · press N to jump here · Enter to add</span>
          <input
            ref={inputRef}
            className="field dump-field"
            type="text"
            name="title"
            autoComplete="off"
            maxLength={500}
            placeholder="Reply to the recruiter"
            aria-label="New task"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <AreaChips value={draftArea} onChange={setDraftArea} label="Area for new tasks (optional)" />
        <button className="button" type="submit">
          Add to Later
        </button>
      </form>

      <div className="chips filters" role="group" aria-label="Show">
        <button
          type="button"
          className="chip label"
          aria-pressed={filter === 'all'}
          onClick={() => chooseFilter('all')}
        >
          All
        </button>
        {AREAS.map((area) => (
          <button
            key={area}
            type="button"
            className="chip label"
            data-area={area}
            aria-pressed={filter === area}
            onClick={() => chooseFilter(area)}
          >
            {AREA_LABELS[area]}
          </button>
        ))}
      </div>

      {later.loadError ? (
        <Alert
          action={
            <button type="button" className="link-button" onClick={() => void later.reload()}>
              Try again
            </button>
          }
        >
          Couldn't load your Later list. Anything you add is kept on this device until it saves.
        </Alert>
      ) : null}

      {later.actionError ? (
        <Alert
          action={
            <button type="button" className="link-button" onClick={later.dismissError}>
              OK
            </button>
          }
        >
          {later.actionError}
        </Alert>
      ) : null}

      {later.recentlyDeleted ? (
        <div className="undo-bar" role="status">
          <span>Deleted "{later.recentlyDeleted.title}".</span>
          <button type="button" className="link-button" onClick={later.undoDelete}>
            Undo
          </button>
        </div>
      ) : null}

      {later.loading ? (
        <p className="label" aria-live="polite">
          Loading…
        </p>
      ) : visible.length === 0 ? (
        <p className="empty-state">
          {filter === 'all'
            ? 'Your brain dump is empty. Type anything on your mind above.'
            : `Nothing in ${AREA_LABELS[filter]} right now.`}
        </p>
      ) : (
        <ul className="task-list">
          {visible.map((item) => (
            <TaskRow
              key={item.id}
              item={item}
              editingArea={editingAreaFor === item.id}
              onEditArea={() => setEditingAreaFor(editingAreaFor === item.id ? null : item.id)}
              onSetArea={(area) => {
                void later.setArea(item.id, area)
                setEditingAreaFor(null)
              }}
              onRetry={() => later.retry(item.id)}
              onDelete={() => later.remove(item.id)}
              moving={movingId === item.id}
              onStartMove={() => setMovingId(movingId === item.id ? null : item.id)}
              onMoved={() => {
                setMovingId(null)
                later.dropMoved(item.id)
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

type RowProps = {
  item: LaterItem
  editingArea: boolean
  onEditArea: () => void
  onSetArea: (area: Area | null) => void
  onRetry: () => void
  onDelete: () => void
  moving: boolean
  onStartMove: () => void
  onMoved: () => void
}

function TaskRow(props: RowProps) {
  const { item, editingArea, onEditArea, onSetArea, onRetry, onDelete, moving, onStartMove, onMoved } = props
  return (
    <li className="task-row">
      <div className="task-line">
        <p className="task-title">{item.title}</p>
        {item.save === 'saved' ? (
          <button
            type="button"
            className="area-tag label"
            aria-expanded={moving}
            aria-label={`Move "${item.title}" to Today`}
            onClick={onStartMove}
          >
            Today →
          </button>
        ) : null}
        <button
          type="button"
          className="area-tag label"
          aria-expanded={editingArea}
          aria-label={`Area: ${item.area ? AREA_LABELS[item.area] : 'none'}. Change area`}
          onClick={onEditArea}
        >
          {item.area ? AREA_LABELS[item.area] : 'no area'}
        </button>
        <button type="button" className="icon-button" aria-label={`Delete "${item.title}"`} onClick={onDelete}>
          ×
        </button>
      </div>
      {editingArea ? <AreaChips value={item.area} onChange={onSetArea} label="Choose an area" /> : null}
      {moving ? (
        <MoveToToday taskId={item.id} title={item.title} onMoved={onMoved} onCancel={onStartMove} />
      ) : null}
      {item.save === 'saving' ? (
        <span className="label" aria-live="polite">
          Saving…
        </span>
      ) : null}
      {item.save === 'failed' ? (
        <Alert
          action={
            <button type="button" className="link-button" onClick={onRetry}>
              Try again
            </button>
          }
        >
          Couldn't save this yet. It's kept on this device.
        </Alert>
      ) : null}
    </li>
  )
}

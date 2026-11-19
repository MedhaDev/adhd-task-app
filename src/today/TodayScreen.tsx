import { Alert } from '../components/Alert'
import { AREA_LABELS } from '../data/areas'
import type { TodayTask } from '../data/today'
import { useToday } from '../data/useToday'
import { routeHref } from '../lib/useRoute'

function firstStep(task: TodayTask): string | null {
  return task.steps.find((s) => s.position === 0)?.body ?? null
}

export function TodayScreen() {
  const today = useToday()
  const [top, ...rest] = today.active
  const regularCount = today.active.filter((t) => t.area !== 'fun').length

  if (today.loading) {
    return (
      <p className="label" aria-live="polite">
        Loading…
      </p>
    )
  }

  return (
    <section className="today" aria-label="Today">
      {today.loadError ? (
        <Alert
          action={
            <button type="button" className="link-button" onClick={() => void today.reload()}>
              Try again
            </button>
          }
        >
          Couldn't load Today. Your tasks are safe; this is only the connection.
        </Alert>
      ) : null}

      {today.actionError ? (
        <Alert
          action={
            <button type="button" className="link-button" onClick={today.dismissError}>
              OK
            </button>
          }
        >
          {today.actionError}
        </Alert>
      ) : null}

      {!top ? (
        <p className="empty-state">
          Nothing in Today yet. <a href={routeHref('later')}>Pick up to 3 from Later →</a>
        </p>
      ) : (
        <>
          <article className="today-top" aria-label={`Start here: ${top.title}`}>
            <span className="label">Start here{top.area ? ` · ${AREA_LABELS[top.area]}` : ''}</span>
            <h2 className="today-top-title">→ {top.title}</h2>
            {firstStep(top) ? <p className="muted">first step: {firstStep(top)}</p> : null}
            <div className="actions">
              <button type="button" className="link-button" onClick={() => void today.finish(top)}>
                Done
              </button>
              <button type="button" className="link-button" onClick={() => void today.backToLater(top)}>
                Back to Later
              </button>
            </div>
          </article>

          {rest.length > 0 ? (
            <ul className="task-list" aria-label="Also today">
              {rest.map((task) => (
                <li key={task.id} className="task-row">
                  <div className="task-line">
                    <p className="task-title">{task.title}</p>
                    {task.area ? <span className="label">{AREA_LABELS[task.area]}</span> : null}
                  </div>
                  <div className="actions">
                    <button type="button" className="link-button label" onClick={() => void today.putFirst(task)}>
                      Start here
                    </button>
                    <button type="button" className="link-button label" onClick={() => void today.finish(task)}>
                      Done
                    </button>
                    <button type="button" className="link-button label" onClick={() => void today.backToLater(task)}>
                      Later
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {regularCount < 3 ? (
            <p className="muted">
              <a href={routeHref('later')}>Room for one more → pick from Later</a>
            </p>
          ) : null}
        </>
      )}

      {today.done.length > 0 ? (
        <section className="done-today" aria-label="Done today">
          <span className="label">Done today</span>
          <ul className="done-list">
            {today.done.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}

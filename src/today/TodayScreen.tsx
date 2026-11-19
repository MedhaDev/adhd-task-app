import { Alert } from '../components/Alert'
import { AREA_LABELS } from '../data/areas'
import type { TodayTask } from '../data/today'
import { useToday } from '../data/useToday'
import { routeHref } from '../lib/useRoute'
import { useParkingLot } from '../data/useParkingLot'
import { ParkedReview } from '../timer/ParkingLot'
import { TimerView } from '../timer/TimerView'
import { useTimer } from '../timer/useTimer'
import { ProgressLine, StepList } from './Steps'

function firstStep(task: TodayTask): string | null {
  return task.steps.find((s) => s.position === 0)?.body ?? null
}

/** The first step not yet ticked, so each task shows where to pick it up. */
function nextStep(task: TodayTask): string {
  return (task.steps.find((s) => s.done_at === null) ?? task.steps[task.steps.length - 1]).body
}

export function TodayScreen() {
  const today = useToday()
  const timer = useTimer()
  const lot = useParkingLot()
  const [top, ...rest] = today.active
  const regularCount = today.active.filter((t) => t.area !== 'fun').length

  function startTimer(task: TodayTask) {
    const step = task.steps.find((s) => s.done_at === null) ?? null
    timer.start({ taskId: task.id, taskTitle: task.title, stepId: step?.id ?? null, stepBody: step?.body ?? null })
  }

  function finishFromTimer() {
    const taskId = timer.finishTask()
    const task = today.active.find((t) => t.id === taskId)
    if (task) void today.finish(task)
  }

  if (timer.phase !== 'idle') {
    return <TimerView timer={timer} lot={lot} onFinishTask={finishFromTimer} />
  }

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

      {timer.note ? (
        <p className="timer-note" role="status">
          {timer.note}
        </p>
      ) : null}

      <ParkedReview lot={lot} />

      {!top ? (
        <p className="empty-state">
          Nothing in Today yet. <a href={routeHref('later')}>Pick up to 3 from Later →</a>
        </p>
      ) : (
        <>
          <article className="today-top" aria-label={`Start here: ${top.title}`}>
            <span className="label">Start here{top.area ? ` · ${AREA_LABELS[top.area]}` : ''}</span>
            <h2 className="today-top-title">→ {top.title}</h2>
            <StepList
              steps={top.steps}
              onToggle={(step) => void today.toggleStep(top, step)}
              onAdd={(body) => today.addStepTo(top, body)}
            />
            <div className="actions">
              <button type="button" className="button" onClick={() => startTimer(top)}>
                Start 5 min
              </button>
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
                  {firstStep(task) ? <p className="muted step-hint">next: {nextStep(task)}</p> : null}
                  <ProgressLine steps={task.steps} />
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

      {timer.minutesToday > 0 ? (
        <p className="muted shown-up">You showed up for {timer.minutesToday} min today.</p>
      ) : null}

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

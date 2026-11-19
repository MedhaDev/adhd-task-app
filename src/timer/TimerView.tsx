import { useEffect } from 'react'
import { Alert } from '../components/Alert'
import { formatClock } from './clock'
import type { useParkingLot } from '../data/useParkingLot'
import { ParkBox, ParkedReview } from './ParkingLot'
import type { useTimer } from './useTimer'

type Timer = ReturnType<typeof useTimer>
type Lot = ReturnType<typeof useParkingLot>

const KIND_LABEL = { starter: 'Just 5 minutes', focus: 'Focus round', break: 'Break' } as const

/** The countdown, or the gentle choice when time is up. */
export function TimerView({ timer, lot, onFinishTask }: { timer: Timer; lot: Lot; onFinishTask: () => void }) {
  const active = timer.active
  const kind = active?.session.kind ?? 'starter'

  // Show the countdown in the browser tab, so it's visible from any other tab.
  useEffect(() => {
    if (!active) return
    const title = active.taskTitle
    document.title = timer.phase === 'ended' ? `Time's up · ${title}` : `${formatClock(timer.remaining)} · ${title}`
  }, [active, timer.phase, timer.remaining])
  useEffect(() => () => void (document.title = 'Today'), [])

  if (!active) return null

  return (
    <section className="timer" aria-label="Timer">
      {timer.saveWarning ? (
        <Alert>Couldn't save this timer yet. It keeps running, and saving is retried.</Alert>
      ) : null}

      <span className="label">
        {KIND_LABEL[kind]} · {active.session.plannedMinutes} min
      </span>
      <p className="timer-task">{active.taskTitle}</p>
      {active.stepBody && kind !== 'break' ? <p className="muted">{active.stepBody}</p> : null}
      {kind === 'break' ? <p className="muted">Stand up, drink some water. Not your phone.</p> : null}

      {timer.phase === 'running' ? (
        <>
          <p className="timer-clock" role="timer" aria-live="off" aria-label={`${formatClock(timer.remaining)} left`}>
            {formatClock(timer.remaining)}
          </p>
          <ParkBox lot={lot} sessionId={active.session.id} />
          <div className="actions">
            <button type="button" className="link-button" onClick={timer.stop}>
              Stop
            </button>
            {kind !== 'break' ? (
              <button type="button" className="link-button" onClick={onFinishTask}>
                Done with this task
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="timer-ended" role="status">
          <ParkedReview lot={lot} />
          {kind === 'starter' ? (
            <>
              <p className="timer-message">5 minutes done. You started. Keep going?</p>
              <div className="actions">
                <button type="button" className="button" onClick={() => timer.keepGoing(15)}>
                  Keep going 15 min
                </button>
                <button type="button" className="button" onClick={() => timer.keepGoing(25)}>
                  Keep going 25 min
                </button>
                <button type="button" className="link-button" onClick={timer.stop}>
                  Stop here
                </button>
              </div>
            </>
          ) : kind === 'focus' ? (
            <>
              <p className="timer-message">Round done. Take a 5-minute break?</p>
              <div className="actions">
                <button type="button" className="button" onClick={timer.takeBreak}>
                  Take a break
                </button>
                <button type="button" className="link-button" onClick={timer.stop}>
                  Stop here
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="timer-message">Break's over. Another round?</p>
              <div className="actions">
                <button type="button" className="button" onClick={() => timer.keepGoing(15)}>
                  Another 15 min
                </button>
                <button type="button" className="button" onClick={() => timer.keepGoing(25)}>
                  Another 25 min
                </button>
                <button type="button" className="link-button" onClick={timer.stop}>
                  Back to Today
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

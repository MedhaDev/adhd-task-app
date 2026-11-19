import { supabase } from '../lib/supabase'
import type { TimerSession } from '../timer/clock'

/**
 * Saves the whole session every time (insert or update by id), so a write that
 * failed earlier is repaired by the next one.
 */
export async function saveSession(s: TimerSession): Promise<void> {
  const { error } = await supabase.from('timer_sessions').upsert(
    {
      id: s.id,
      task_id: s.taskId,
      step_id: s.stepId,
      kind: s.kind,
      planned_minutes: s.plannedMinutes,
      started_at: s.startedAt,
      ended_at: s.endedAt,
      outcome: s.outcome,
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function fetchSessionsSince(since: Date): Promise<TimerSession[]> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('id, task_id, step_id, kind, planned_minutes, started_at, ended_at, outcome')
    .gte('started_at', since.toISOString())
  if (error) throw error
  return data.map((r) => ({
    id: r.id,
    taskId: r.task_id,
    stepId: r.step_id,
    kind: r.kind,
    plannedMinutes: r.planned_minutes as TimerSession['plannedMinutes'],
    startedAt: r.started_at,
    endedAt: r.ended_at,
    outcome: r.outcome,
  }))
}

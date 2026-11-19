import { supabase } from '../lib/supabase'
import type { Area } from './areas'

export type Step = { id: string; body: string; position: number; done_at: string | null }
export type TodayTask = {
  id: string
  title: string
  area: Area | null
  today_position: number | null
  steps: Step[]
}
export type DoneTask = { id: string; title: string; finished_at: string | null }

/**
 * The start of "today": 4am in the person's own time zone, so a late night
 * still counts as the same day.
 */
export function dayStart(now: Date = new Date(), resetHour = 4): Date {
  const start = new Date(now)
  start.setHours(resetHour, 0, 0, 0)
  if (now < start) start.setDate(start.getDate() - 1)
  return start
}

/** Quietly sends yesterday's unfinished Today tasks back to Later. */
export async function resetToday(since: Date): Promise<void> {
  const { error } = await supabase.rpc('reset_today', { p_since: since.toISOString() })
  if (error) throw error
}

export async function fetchToday(since: Date): Promise<{ active: TodayTask[]; done: DoneTask[] }> {
  const [active, done] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, area, today_position, steps(id, body, position, done_at)')
      .eq('status', 'today')
      .order('today_position', { ascending: true, nullsFirst: false }),
    supabase
      .from('tasks')
      .select('id, title, finished_at')
      .eq('status', 'done')
      .gte('finished_at', since.toISOString())
      .order('finished_at', { ascending: true }),
  ])
  if (active.error) throw active.error
  if (done.error) throw done.error
  return {
    active: active.data.map((t) => ({ ...t, steps: [...t.steps].sort((a, b) => a.position - b.position) })),
    done: done.data,
  }
}

export async function moveToToday(taskId: string, firstStep: string): Promise<void> {
  const { error } = await supabase.rpc('move_to_today', { p_task_id: taskId, p_first_step: firstStep })
  if (error) throw error
}

export async function startHere(taskId: string): Promise<void> {
  const { error } = await supabase.rpc('start_here', { p_task_id: taskId })
  if (error) throw error
}

export async function finishTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'done', finished_at: new Date().toISOString(), today_position: null })
    .eq('id', taskId)
  if (error) throw error
}

export async function sendBackToLater(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'later', today_position: null, moved_to_today_at: null })
    .eq('id', taskId)
  if (error) throw error
}

/** Plain-language reasons a move into Today was refused. */
export function moveErrorMessage(error: unknown): string {
  const text = String((error as { message?: string } | null)?.message ?? '')
  if (text.includes('today_fun_full')) return 'Today already has its Fun task. Finish it or move it back first.'
  if (text.includes('today_full')) return 'Today already has 3. Finish one or move one back to Later first.'
  if (text.includes('first_step_required')) return "Write the first tiny step, even if it's small."
  if (text.includes('task_not_in_later')) return 'That task is already in Today or done.'
  return "Couldn't move it to Today. Check your connection and try again."
}

/** Adds a step. The id is made on the device, so a retry can't add it twice. */
export async function addStep(step: { id: string; taskId: string; body: string; position: number }): Promise<void> {
  const { error } = await supabase
    .from('steps')
    .insert({ id: step.id, task_id: step.taskId, body: step.body, position: step.position })
  if (error && error.code !== '23505') throw error
}

export async function setStepDone(stepId: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from('steps')
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq('id', stepId)
  if (error) throw error
}

/** How far along a task is, from its steps. */
export function progress(steps: Step[]): { done: number; total: number } {
  return { done: steps.filter((s) => s.done_at !== null).length, total: steps.length }
}

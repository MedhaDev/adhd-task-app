import { supabase } from '../lib/supabase'
import type { TableRow } from '../lib/database.types'
import type { Area } from './areas'

export type Task = Pick<TableRow<'tasks'>, 'id' | 'title' | 'area' | 'status' | 'created_at'>

const TASK_COLUMNS = 'id, title, area, status, created_at'

/** All tasks in Later, newest first. Throws if the request fails. */
export async function fetchLaterTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('status', 'later')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Saves a new task. The id is made on the device, so retrying after a failure
 * can never create a duplicate: if the row already exists, that counts as saved.
 */
export async function insertTask(task: { id: string; title: string; area: Area | null }): Promise<void> {
  const { error } = await supabase.from('tasks').insert(task)
  if (error && error.code !== '23505') throw error
}

export async function updateTaskArea(id: string, area: Area | null): Promise<void> {
  const { error } = await supabase.from('tasks').update({ area }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

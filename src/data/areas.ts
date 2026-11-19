import { Constants, type EnumOf } from '../lib/database.types'

export type Area = EnumOf<'task_area'>

export const AREAS: readonly Area[] = Constants.public.Enums.task_area

export const AREA_LABELS: Record<Area, string> = {
  work: 'Work',
  job_search: 'Job search',
  personal: 'Personal',
  fun: 'Fun',
}

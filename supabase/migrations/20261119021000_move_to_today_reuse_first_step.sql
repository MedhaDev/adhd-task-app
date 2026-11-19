-- A task that goes back to Later and returns to Today keeps one first step:
-- update the existing step at position 0 instead of adding another.
create or replace function public.move_to_today(p_task_id uuid, p_first_step text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_area public.task_area;
  v_regular int;
  v_fun int;
  v_next smallint;
begin
  if p_first_step is null or char_length(btrim(p_first_step)) = 0 then
    raise exception 'first_step_required' using errcode = '22023';
  end if;

  select area into v_area
  from public.tasks
  where id = p_task_id and status = 'later'
  for update;
  if not found then
    raise exception 'task_not_in_later' using errcode = 'P0002';
  end if;

  select count(*) filter (where area is distinct from 'fun'),
         count(*) filter (where area = 'fun'),
         coalesce(max(today_position), -1) + 1
    into v_regular, v_fun, v_next
  from public.tasks
  where status = 'today';

  if v_area = 'fun' and v_fun >= 1 then
    raise exception 'today_fun_full' using errcode = 'P0001';
  elsif v_area is distinct from 'fun' and v_regular >= 3 then
    raise exception 'today_full' using errcode = 'P0001';
  end if;

  update public.steps
  set body = btrim(p_first_step), done_at = null
  where task_id = p_task_id and position = 0;
  if not found then
    insert into public.steps (task_id, body, position)
    values (p_task_id, btrim(p_first_step), 0);
  end if;

  update public.tasks
  set status = 'today',
      today_position = least(v_next, 9),
      moved_to_today_at = now()
  where id = p_task_id;
end;
$$;

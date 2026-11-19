-- Today: moving tasks in and out happens in single all-or-nothing steps here,
-- so the limit (3 tasks + 1 Fun) holds even if the app has a bug.
-- All functions run as the signed-in person (security invoker), so Row Level
-- Security still applies to every row they touch.

-- Move a task from Later into Today, with its tiny first step.
create function public.move_to_today(p_task_id uuid, p_first_step text)
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

  insert into public.steps (task_id, body, position)
  values (p_task_id, btrim(p_first_step), 0);

  update public.tasks
  set status = 'today',
      today_position = least(v_next, 9),
      moved_to_today_at = now()
  where id = p_task_id;
end;
$$;

-- Put one Today task at the top ("start here") and renumber the rest.
create function public.start_here(p_task_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.tasks t
  set today_position = ranked.pos
  from (
    select id,
           (row_number() over (
              order by (id = p_task_id) desc, today_position nulls last, moved_to_today_at
            ) - 1)::smallint as pos
    from public.tasks
    where status = 'today'
  ) ranked
  where t.id = ranked.id;
end;
$$;

-- Quietly send yesterday's unfinished Today tasks back to Later.
-- The app passes the last 4am in the person's own time zone.
create function public.reset_today(p_since timestamptz)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.tasks
  set status = 'later', today_position = null, moved_to_today_at = null
  where status = 'today' and moved_to_today_at < p_since;
$$;

revoke execute on function public.move_to_today(uuid, text) from public, anon;
revoke execute on function public.start_here(uuid) from public, anon;
revoke execute on function public.reset_today(timestamptz) from public, anon;
grant execute on function public.move_to_today(uuid, text) to authenticated;
grant execute on function public.start_here(uuid) to authenticated;
grant execute on function public.reset_today(timestamptz) to authenticated;

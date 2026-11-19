-- Record task changes in the events log automatically, so the experiment data
-- can't be forgotten or skipped by the app. Runs as the signed-in person, so
-- the events table's Row Level Security still applies.
create function public.log_task_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.events (user_id, task_id, name, details)
    values (new.user_id, new.id, 'task_added',
            jsonb_build_object('area', new.area, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.events (user_id, task_id, name, details)
      values (new.user_id, new.id, 'task_moved',
              jsonb_build_object('from', old.status, 'to', new.status));
    end if;
    if new.area is distinct from old.area then
      insert into public.events (user_id, task_id, name, details)
      values (new.user_id, new.id, 'task_area_set',
              jsonb_build_object('from', old.area, 'to', new.area));
    end if;
    return new;
  else
    -- The task row is gone, so keep its id in details instead of the link.
    insert into public.events (user_id, task_id, name, details)
    values (old.user_id, null, 'task_deleted',
            jsonb_build_object('task_id', old.id, 'status', old.status));
    return old;
  end if;
end;
$$;

create trigger tasks_log_events
  after insert or update or delete on public.tasks
  for each row execute function public.log_task_event();

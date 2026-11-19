-- Record every timer start and how it ended (kept going, stopped, finished,
-- abandoned), for the experiment's start rate and keep-going rate.
-- Runs as the signed-in person, so Row Level Security still applies.
create function public.log_timer_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.events (user_id, task_id, name, details)
    values (new.user_id, new.task_id, 'timer_started',
            jsonb_build_object('session_id', new.id, 'kind', new.kind,
                               'planned_minutes', new.planned_minutes));
  end if;

  if new.outcome is not null and (tg_op = 'INSERT' or old.outcome is distinct from new.outcome) then
    insert into public.events (user_id, task_id, name, details)
    values (new.user_id, new.task_id, 'timer_ended',
            jsonb_build_object(
              'session_id', new.id, 'kind', new.kind, 'outcome', new.outcome,
              'minutes', round((extract(epoch from (coalesce(new.ended_at, now()) - new.started_at)) / 60.0)::numeric, 1)));
  end if;

  return new;
end;
$$;

create trigger timer_sessions_log_events
  after insert or update on public.timer_sessions
  for each row execute function public.log_timer_event();
